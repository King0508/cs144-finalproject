import { describe, expect, it } from "vitest";
import { classifyGeminiError } from "../src/services/gemini.js";

describe("classifyGeminiError", () => {
  it("maps quota / 429 errors to a 429 with a usage-limit message", () => {
    expect(classifyGeminiError({ status: 429 })).toEqual({
      httpStatus: 429,
      message: "The AI assistant has hit its usage limit. Please try again later.",
    });
    const fromText = classifyGeminiError(new Error("[429 Too Many Requests] You exceeded your current quota"));
    expect(fromText.httpStatus).toBe(429);
  });

  it("maps overload / 503 errors to a 503 with a try-again message", () => {
    expect(classifyGeminiError({ status: 503 }).httpStatus).toBe(503);
    const fromText = classifyGeminiError(new Error("[503 Service Unavailable] model is experiencing high demand"));
    expect(fromText.httpStatus).toBe(503);
    expect(fromText.message).toContain("temporarily busy");
  });

  it("falls back to 500 for unrecognized errors", () => {
    expect(classifyGeminiError(new Error("boom"))).toEqual({
      httpStatus: 500,
      message: "AI request failed.",
    });
  });
});
