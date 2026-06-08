import { GoogleGenerativeAI, SchemaType, type FunctionDeclaration, type Tool } from "@google/generative-ai";
import { CURRICULUM } from "../curriculum.js";
import { tools, type Scope } from "./firestoreTools.js";

const MODEL = "gemini-2.5-flash";

function client(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is required.");
  return new GoogleGenerativeAI(key);
}

// ---- Feature 1: next-study follow-up message ------------------------------

export async function generateFollowUpMessage(args: {
  inviteeName: string;
  completedStudy: string | null;
  nextStudy: string;
  leadName: string;
}): Promise<string> {
  const { inviteeName, completedStudy, nextStudy, leadName } = args;
  const sys = `You are a warm, encouraging Christian bible-study leader assistant.
Write a short follow-up message (max 2 sentences, plain text, no markdown) that a leader could paste into a group chat to invite ${inviteeName} to schedule the "${nextStudy}" bible study. ${completedStudy ? `They just finished "${completedStudy}".` : "They have not started any studies yet."} The leader's name is ${leadName}. Be warm, specific, and human. Do not invent specific dates or times.`;

  const model = client().getGenerativeModel({ model: MODEL });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: sys }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
  });
  return result.response.text().trim();
}

// ---- Feature 2: natural-language Q&A with function-calling ----------------

const FUNCTION_DECLS: FunctionDeclaration[] = [
  {
    name: "listStudies",
    description:
      "List bible studies. Returns up to 100 results scoped to what the caller is allowed to see.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        studyName: {
          type: SchemaType.STRING,
          description: `Optional. Restrict to one of: ${CURRICULUM.join(", ")}.`,
        },
        weekOf: {
          type: SchemaType.STRING,
          description: "Optional. Monday of the week, formatted as YYYY-MM-DD.",
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
    description: "Count bible studies matching the same filters as listStudies. Use this for 'how many' questions.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        studyName: { type: SchemaType.STRING },
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

const SYSTEM_INSTRUCTION = `You are MinistryBot, a helpful assistant inside a campus ministry app.
You answer questions about bible studies and invitees by calling the provided tools.
Always call a tool when the user asks for counts, lists, or names — never make up data.
When formatting dates, prefer "Tue, Oct 8 at 3:00 PM".
If the user's question requires data you cannot access, say so plainly.
Keep answers concise (max ~80 words).`;

export interface AskResult {
  answer: string;
  usedTools: string[];
}

export async function askGemini(question: string, scope: Scope): Promise<AskResult> {
  const model = client().getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: TOOLS,
  });

  const chat = model.startChat({ tools: TOOLS });
  const usedTools: string[] = [];

  let response = await chat.sendMessage(question);

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
    response = await chat.sendMessage(results);
  }

  return { answer: response.response.text().trim(), usedTools };
}
