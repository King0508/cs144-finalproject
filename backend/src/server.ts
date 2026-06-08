import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import aiRouter from "./routes/ai.js";
import notifyRouter from "./routes/notify.js";
import devRouter from "./routes/dev.js";
import { verifyFirebaseToken } from "./middleware/verifyFirebaseToken.js";
import { startScheduler } from "./services/scheduler.js";

const app = express();
const PORT = Number(process.env.PORT ?? 8080);

app.disable("x-powered-by");
app.set("trust proxy", 1);

// Liveness/readiness probes — un-authenticated, used by GKE.
app.get("/healthz", (_req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.get("/readyz", (_req, res) => res.json({ ok: true }));

// --- Global security middleware ------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false, // SPA is served by nginx with its own CSP.
    crossOriginEmbedderPolicy: false,
  }),
);

const allowed = (process.env.CORS_ALLOW_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// In dev mode, Vite may pick any free port (5173, 5174, …) if earlier instances
// still hold the default. Auto-allow any localhost origin then so the dev loop
// is not held hostage by a stale port. Production stays locked to the env list.
const isDev = process.env.NODE_ENV !== "production";
const LOCALHOST_RE = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // mobile apps / curl have no Origin
      if (allowed.includes(origin)) return cb(null, true);
      if (isDev && LOCALHOST_RE.test(origin)) return cb(null, true);
      // Reject without throwing so the browser sees a plain CORS block instead
      // of our global error handler returning 500 "Internal server error".
      cb(null, false);
    },
    credentials: false, // We use bearer tokens, not cookies.
  }),
);

app.use(express.json({ limit: "32kb" }));

const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 60, // 60 req/min per IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// --- Authenticated API routes --------------------------------------------------
app.use("/api", apiLimiter, verifyFirebaseToken);
app.use("/api/ai", aiRouter);
app.use("/api/notify", notifyRouter);

// Dev-only routes (role switcher etc). Gated by NODE_ENV so a production build
// cannot reach them at all — Firestore rules remain the sole authority on role
// changes in real environments.
if (process.env.NODE_ENV !== "production") {
  app.use("/api/dev", devRouter);
  console.info(
    "[server] DEV routes mounted at /api/dev — DO NOT enable in production",
  );
}

// --- Error handler -------------------------------------------------------------
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[server] unhandled error", err);
  res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(PORT, () => {
  console.info(`[server] listening on http://0.0.0.0:${PORT}`);
});

const stopScheduler = startScheduler();

function shutdown(signal: string) {
  console.info(`[server] ${signal} received, shutting down`);
  stopScheduler();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export { app };
