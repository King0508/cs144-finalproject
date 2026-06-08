import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import type { AuthedRequest } from "../src/middleware/verifyFirebaseToken.js";

// Mock the firebase module before importing the middleware.
vi.mock("../src/firebase.js", () => {
  return {
    auth: () => ({
      verifyIdToken: vi.fn(async (token: string) => {
        if (token === "ok") return { uid: "u1", email: "a@b.com" };
        throw new Error("bad token");
      }),
    }),
    db: () => ({
      collection: () => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            data: () => ({ role: "member", bibleTalkId: "bt1", campusId: "c1" }),
          }),
        }),
      }),
    }),
  };
});

const { verifyFirebaseToken } = await import("../src/middleware/verifyFirebaseToken.js");

function mockRes() {
  const r: Partial<Response> & { _status?: number; _json?: unknown } = {
    status(code: number) {
      r._status = code;
      return r as Response;
    },
    json(payload: unknown) {
      r._json = payload;
      return r as Response;
    },
  };
  return r as Response & { _status?: number; _json?: unknown };
}

describe("verifyFirebaseToken", () => {
  it("401s when the Authorization header is missing", async () => {
    const req = { header: () => undefined } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();
    await verifyFirebaseToken(req, res, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("401s on a bad token", async () => {
    const req = { header: (n: string) => (n.toLowerCase() === "authorization" ? "Bearer nope" : undefined) } as unknown as Request;
    const res = mockRes();
    const next = vi.fn();
    await verifyFirebaseToken(req, res, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next() and attaches authUser on a good token", async () => {
    const req: AuthedRequest = {
      header: (n: string) => (n.toLowerCase() === "authorization" ? "Bearer ok" : undefined),
    } as unknown as AuthedRequest;
    const res = mockRes();
    const next = vi.fn();
    await verifyFirebaseToken(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.authUser?.uid).toBe("u1");
  });
});
