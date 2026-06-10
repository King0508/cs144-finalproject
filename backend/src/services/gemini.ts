import { GoogleGenerativeAI, SchemaType, type FunctionDeclaration, type Tool } from "@google/generative-ai";
import { CURRICULUM } from "../curriculum.js";
import { laDisplayDate, laDateString, laWeekMonday, laMonthRange, MINISTRY_TZ } from "../lib/laDates.js";
import { tools, type Scope } from "./firestoreTools.js";

// Default to flash-lite: it has a separate free-tier quota bucket and supports
// both function-calling and thinkingConfig. Override with GEMINI_MODEL (e.g.
// "gemini-2.5-flash") once billing raises the project's rate limits.
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

function client(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is required.");
  return new GoogleGenerativeAI(key);
}

/**
 * Classifies a Gemini SDK error into a user-facing HTTP status + message.
 * The deprecated SDK throws errors carrying a numeric `status` and a message
 * that embeds the upstream code (e.g. "[429 Too Many Requests]").
 */
export function classifyGeminiError(err: unknown): { httpStatus: number; message: string } {
  const status =
    typeof (err as { status?: unknown })?.status === "number"
      ? (err as { status: number }).status
      : undefined;
  const text = err instanceof Error ? err.message : String(err);
  const isRateLimited = status === 429 || /\b429\b|RESOURCE_EXHAUSTED|quota/i.test(text);
  const isUnavailable =
    status === 503 || status === 500 || /\b50[03]\b|UNAVAILABLE|overloaded|high demand/i.test(text);

  if (isRateLimited) {
    return {
      httpStatus: 429,
      message: "The AI assistant has hit its usage limit. Please try again later.",
    };
  }
  if (isUnavailable) {
    return {
      httpStatus: 503,
      message: "The AI assistant is temporarily busy. Please try again in a moment.",
    };
  }
  return { httpStatus: 500, message: "AI request failed." };
}

/** True for transient upstream errors worth retrying (503/500 overload). 429 is not retried. */
function isTransientGeminiError(err: unknown): boolean {
  const status = (err as { status?: unknown })?.status;
  const text = err instanceof Error ? err.message : String(err);
  return status === 503 || status === 500 || /\b50[03]\b|UNAVAILABLE|overloaded|high demand/i.test(text);
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Runs `fn`, retrying only transient errors with exponential-ish backoff. */
async function withRetry<T>(fn: () => Promise<T>, backoffsMs: number[] = [400, 1200]): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= backoffsMs.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < backoffsMs.length && isTransientGeminiError(err)) {
        await delay(backoffsMs[attempt]);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// ---- Feature 1: next-study follow-up message ------------------------------

interface FollowUpArgs {
  inviteeName: string;
  completedStudy: string | null;
  nextStudy: string;
  leadName: string;
}

const FOLLOW_UP_SYSTEM = `You are a warm, encouraging Christian bible-study leader assistant helping a leader write a follow-up message.
Write a COMPLETE message (2-3 sentences, plain text, no markdown, no placeholders) that the leader can paste into a group chat. Structure it as:
1. A warm, personal greeting that uses the invitee's first name.
2. An invitation to the next bible study, naming it explicitly. If they just finished a study, briefly affirm that first.
3. A friendly ask about availability, phrased as asking which day THIS WEEK they would be free to meet.
Do NOT invent or state a specific date or time — ask for their availability instead. Sign off with the leader's name. Always finish your sentences.`;

function buildFollowUpPrompt(args: FollowUpArgs): string {
  const { inviteeName, completedStudy, nextStudy, leadName } = args;
  const finished = completedStudy
    ? `They just finished the "${completedStudy}" study.`
    : "They have not started any studies yet.";
  return `Invitee first name: ${inviteeName}
Next study to invite them to: "${nextStudy}"
Context: ${finished}
Leader's name (sign off as this): ${leadName}
Write the message now.`;
}

/** Deterministic fallback so the UI never shows a truncated fragment. */
function fallbackFollowUp(args: FollowUpArgs): string {
  const { inviteeName, completedStudy, nextStudy, leadName } = args;
  const opener = completedStudy
    ? `Hey ${inviteeName}! It was awesome going through "${completedStudy}" with you.`
    : `Hey ${inviteeName}! It's been great getting to know you.`;
  return `${opener} I'd love to keep things going with our next study, "${nextStudy}" — which day this week would you be free to meet? Let me know what works! - ${leadName}`;
}

async function generateOnce(args: FollowUpArgs): Promise<{ text: string; truncated: boolean }> {
  const model = client().getGenerativeModel({ model: MODEL, systemInstruction: FOLLOW_UP_SYSTEM });
  // gemini-2.5-flash is a thinking model; give a generous output cap and turn
  // thinking off so reasoning tokens can't starve the visible reply. The
  // legacy SDK doesn't type `thinkingConfig`, so it rides along on a plain
  // object (width-subtyped) into the request body.
  const generationConfig = {
    temperature: 0.7,
    maxOutputTokens: 800,
    thinkingConfig: { thinkingBudget: 0 },
  };
  const result = await withRetry(() =>
    model.generateContent({
      contents: [{ role: "user", parts: [{ text: buildFollowUpPrompt(args) }] }],
      generationConfig,
    }),
  );
  let text = "";
  try {
    text = result.response.text().trim();
  } catch {
    text = "";
  }
  const finishReason = result.response.candidates?.[0]?.finishReason;
  const truncated = String(finishReason) === "MAX_TOKENS" || text.length < 40;
  return { text, truncated };
}

export async function generateFollowUpMessage(args: FollowUpArgs): Promise<string> {
  try {
    let attempt = await generateOnce(args);
    if (attempt.truncated) {
      attempt = await generateOnce(args);
    }
    if (attempt.text && !attempt.truncated) return attempt.text;
  } catch (err) {
    console.warn("[ai/next-study] generation failed, using fallback", err);
  }
  return fallbackFollowUp(args);
}

// ---- Feature 2: natural-language Q&A with function-calling ----------------

const STUDY_NAME_DESC = `Optional. Restrict to one of: ${CURRICULUM.join(", ")}.`;
const START_DATE_DESC =
  "Optional. Inclusive start of a date range, YYYY-MM-DD, interpreted in America/Los_Angeles. Use with endDate for 'today', 'this week', 'this month', etc.";
const END_DATE_DESC =
  "Optional. Exclusive end of a date range, YYYY-MM-DD, interpreted in America/Los_Angeles. Should be the day AFTER the last day you want included.";

const FUNCTION_DECLS: FunctionDeclaration[] = [
  {
    name: "listStudies",
    description:
      "List bible studies. Returns up to 100 results scoped to what the caller is allowed to see. Use startDate/endDate to restrict to a time period.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        studyName: {
          type: SchemaType.STRING,
          description: STUDY_NAME_DESC,
        },
        startDate: { type: SchemaType.STRING, description: START_DATE_DESC },
        endDate: { type: SchemaType.STRING, description: END_DATE_DESC },
        weekOf: {
          type: SchemaType.STRING,
          description:
            "Deprecated shortcut for a single week. Prefer startDate/endDate. Monday of the week, formatted as YYYY-MM-DD.",
        },
        campusId: { type: SchemaType.STRING, description: "Optional campus id." },
        bibleTalkId: { type: SchemaType.STRING, description: "Optional bible-talk id." },
        gender: {
          type: SchemaType.STRING,
          description: "Optional. Either 'M' (men's studies) or 'F' (women's studies).",
        },
        status: {
          type: SchemaType.STRING,
          description: "Optional. One of 'scheduled', 'completed', 'cancelled'.",
        },
      },
    },
  },
  {
    name: "countStudies",
    description:
      "Count bible studies matching the same filters as listStudies. Use this for 'how many' questions, e.g. 'how many <studyName> studies are happening <time period>' — combine studyName with startDate/endDate.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        studyName: { type: SchemaType.STRING, description: STUDY_NAME_DESC },
        startDate: { type: SchemaType.STRING, description: START_DATE_DESC },
        endDate: { type: SchemaType.STRING, description: END_DATE_DESC },
        weekOf: { type: SchemaType.STRING },
        campusId: { type: SchemaType.STRING },
        bibleTalkId: { type: SchemaType.STRING },
        gender: { type: SchemaType.STRING },
        status: { type: SchemaType.STRING },
      },
    },
  },
  {
    name: "listInvitees",
    description: "List invitees (people being studied with), optionally filtered by completion progress.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        campusId: { type: SchemaType.STRING },
        bibleTalkId: { type: SchemaType.STRING },
        completedStudyIndex: {
          type: SchemaType.NUMBER,
          description:
            "Optional. Filter to invitees whose currentStudyIndex is greater than or equal to this value. 0 = completed at least 'Seeking God', 7 = completed all 8.",
        },
      },
    },
  },
];

const TOOLS: Tool[] = [{ functionDeclarations: FUNCTION_DECLS }];

function buildSystemInstruction(now: Date = new Date()): string {
  const today = laDateString(now);
  const monday = laWeekMonday(now);
  const { start: monthStart, endExclusive: monthEnd } = laMonthRange(now);
  return `You are MinistryBot, a helpful assistant inside a campus ministry app.
You answer questions about bible studies and invitees by calling the provided tools.
Always call a tool when the user asks for counts, lists, or names — never make up data.

Today is ${laDisplayDate(now)} (${today}) in the ${MINISTRY_TZ} timezone. Resolve relative time references against this date and pass concrete startDate (inclusive) and endDate (exclusive) values to the tools:
- "today" -> startDate ${today}, endDate the next calendar day.
- "this week" -> startDate ${monday} (Monday), endDate the following Monday.
- "this month" -> startDate ${monthStart}, endDate ${monthEnd}.
- Open-ended ranges like "next 3 days" or "next week": compute the matching dates yourself from today.
For questions like "how many <study> studies are happening <time period>", call countStudies with studyName plus startDate/endDate.

When formatting dates in your answer, prefer "Tue, Oct 8 at 3:00 PM".
If the user's question requires data you cannot access, say so plainly.
Keep answers concise (max ~80 words).`;
}

export interface AskResult {
  answer: string;
  usedTools: string[];
}

export async function askGemini(question: string, scope: Scope): Promise<AskResult> {
  // Disable thinking to cut token usage (and ease rate-limit pressure) on a
  // tool-driven path that already loops up to 4 times. The legacy SDK doesn't
  // type `thinkingConfig`, so it rides along on a plain (width-subtyped) object.
  const generationConfig = { maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } };
  const model = client().getGenerativeModel({
    model: MODEL,
    systemInstruction: buildSystemInstruction(),
    tools: TOOLS,
    generationConfig,
  });

  const chat = model.startChat({ tools: TOOLS });
  const usedTools: string[] = [];

  let response = await withRetry(() => chat.sendMessage(question));

  // Loop: keep handling tool calls until Gemini returns plain text.
  for (let i = 0; i < 4; i++) {
    const calls = response.response.functionCalls();
    if (!calls || calls.length === 0) break;

    const results = await Promise.all(
      calls.map(async (call) => {
        usedTools.push(call.name);
        try {
          let data: unknown;
          if (call.name === "listStudies") {
            data = await tools.listStudies(call.args as Parameters<typeof tools.listStudies>[0], scope);
          } else if (call.name === "countStudies") {
            data = await tools.countStudies(call.args as Parameters<typeof tools.countStudies>[0], scope);
          } else if (call.name === "listInvitees") {
            data = await tools.listInvitees(call.args as Parameters<typeof tools.listInvitees>[0], scope);
          } else {
            data = { error: `Unknown tool ${call.name}` };
          }
          return { functionResponse: { name: call.name, response: { result: data } } };
        } catch (err) {
          return {
            functionResponse: {
              name: call.name,
              response: { error: err instanceof Error ? err.message : String(err) },
            },
          };
        }
      }),
    );
    response = await withRetry(() => chat.sendMessage(results));
  }

  return { answer: response.response.text().trim(), usedTools };
}
