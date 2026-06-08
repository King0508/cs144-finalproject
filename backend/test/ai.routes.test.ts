import { describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

// Mock firebase + gemini before importing the router so the router picks up
// the stubs.
const fakeInvitee = {
  exists: true,
  data: () => ({
    name: "John Test",
    currentStudyIndex: 0,
    bibleTalkId: "bt1",
    campusId: "c1",
  }),
};

vi.mock("../src/firebase.js", () => ({
  db: () => ({
    collection: () => ({
      doc: () => ({ get: async () => fakeInvitee }),
    }),
  }),
}));

vi.mock("../src/services/gemini.js", () => ({
  generateFollowUpMessage: vi.fn(async (args: { nextStudy: string }) => `Mock message about ${args.nextStudy}`),
  askGemini: vi.fn(async (q: string) => ({ answer: `mock answer to: ${q}`, usedTools: ["listStudies"] })),
}));

const { default: aiRouter } = await import("../src/routes/ai.js");

function makeApp(authUser: {
  uid: string;
  email: string;
  role: "member" | "btLeader" | "ministryLeader";
  campusId?: string;
  bibleTalkId?: string;
}) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as unknown as { authUser: typeof authUser }).authUser = authUser;
    next();
  });
  app.use("/api/ai", aiRouter);
  return app;
}

describe("POST /api/ai/next-study", () => {
  it("returns the next study and a Gemini-drafted message", async () => {
    const app = makeApp({ uid: "u1", email: "lead@example.com", role: "member", bibleTalkId: "bt1", campusId: "c1" });
    const res = await request(app).post("/api/ai/next-study").send({ inviteeId: "inv-john" });
    expect(res.status).toBe(200);
    // John's currentStudyIndex is 0 -> next is "Word of God".
    expect(res.body.nextStudyName).toBe("Word of God");
    expect(res.body.suggestedMessage).toContain("Word of God");
  });

  it("403s when the invitee is out of the caller's scope", async () => {
    const app = makeApp({ uid: "u2", email: "x@y.com", role: "member", bibleTalkId: "different-bt", campusId: "c1" });
    const res = await request(app).post("/api/ai/next-study").send({ inviteeId: "inv-john" });
    expect(res.status).toBe(403);
  });

  it("400s when the body is malformed", async () => {
    const app = makeApp({ uid: "u1", email: "a@b.com", role: "ministryLeader" });
    const res = await request(app).post("/api/ai/next-study").send({});
    expect(res.status).toBe(400);
  });
});

describe("POST /api/ai/ask", () => {
  it("forwards the question to Gemini and returns the answer", async () => {
    const app = makeApp({ uid: "u1", email: "a@b.com", role: "ministryLeader" });
    const res = await request(app).post("/api/ai/ask").send({ question: "How many studies this week?" });
    expect(res.status).toBe(200);
    expect(res.body.answer).toContain("mock answer to");
    expect(res.body.usedTools).toContain("listStudies");
  });
});
