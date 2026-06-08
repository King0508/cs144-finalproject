# Requirements

Sentence-per-bullet mapping from the project spec to where it lives in this repo, plus an AI-usage itemization at the bottom.

## Look and Feel

- **Semantic HTML5** — every page uses `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<time>` and `<footer>` appropriately; `<div>`/`<span>` are reserved for pure layout. Examples: [`AppShell.tsx`](../frontend/src/components/AppShell.tsx), [`BibleTalkChat.tsx`](../frontend/src/pages/BibleTalkChat.tsx) (each message is an `<article>`), [`Dashboard.tsx`](../frontend/src/pages/Dashboard.tsx).
- **Two interactive APIs (must be ≥ 2)** — both used meaningfully, not as decoration:
  1. **HTML5 Drag and Drop** — `WeeklyCalendar` ([`components/WeeklyCalendar.tsx`](../frontend/src/components/WeeklyCalendar.tsx)) lets you drag a study card to a new day/hour. Native `onDragStart`/`onDrop`, `dataTransfer.setData("text/plain", studyId)`, writes the new `scheduledAt` back to Firestore. Keyboard fallback: focus the study card and press Shift + arrow keys (this also satisfies the accessibility item).
  2. **HTML5 Canvas 2D** — `WeeklyHeatmapCanvas` ([`components/WeeklyHeatmapCanvas.tsx`](../frontend/src/components/WeeklyHeatmapCanvas.tsx)) hand-draws the dashboard heatmap pixel-by-pixel via `CanvasRenderingContext2D`. Cell **hue** shifts cool-to-warm by time of day, **opacity** scales with study count, and inline `M`/`F` glyphs show gender breakdown. Pointer hit-testing drives a tooltip listing each study in the slot. The canvas is mirrored by a `sr-only-table` so screen-reader users get the same data.
- **Responsive at 320/768/1024** — Tailwind responsive prefixes; the desktop top-nav collapses to a bottom-tab nav on mobile (`md:hidden` + `hidden md:flex` in [`AppShell.tsx`](../frontend/src/components/AppShell.tsx)). Calendar, chat, and dashboard all reflow to single-column at 320px. Verified manually in Chrome DevTools device toolbar.
- **CSS framework** — Tailwind CSS only ([`tailwind.config.js`](../frontend/tailwind.config.js), [`postcss.config.js`](../frontend/postcss.config.js), reusable component classes in [`src/index.css`](../frontend/src/index.css)). No vanilla CSS files, no styled-components, no other CSS framework.
- **SPA** — React Router v6 ([`App.tsx`](../frontend/src/App.tsx)). Every navigation is client-side; nginx's `try_files $uri $uri/ /index.html` fallback ([`nginx.conf`](../frontend/nginx.conf)) means deep links also serve the SPA shell.
- **Front-end framework** — React 18 with TypeScript and Vite.
- **Back-end framework** — Node.js + Express 4 with TypeScript ([`backend/src/server.ts`](../backend/src/server.ts)).
- **Accessibility** — semantic landmarks, ARIA-live region announces new chat messages ([`BibleTalkChat.tsx`](../frontend/src/pages/BibleTalkChat.tsx)) and calendar reschedules ([`WeeklyCalendar.tsx`](../frontend/src/components/WeeklyCalendar.tsx)), skip-link in `AppShell`, focus is moved to `<main>` on route change, keyboard fallback for drag-and-drop, color contrast checked against WCAG AA (Tailwind palette: `ink-700` on `white` ≥ 12:1), and the Canvas heatmap has a visually-hidden `<table>` mirror.

## PWA

- **Offline + installable** — `vite-plugin-pwa` configured in [`vite.config.ts`](../frontend/vite.config.ts) emits a `manifest.webmanifest` and a Workbox-based service worker [`src/sw.ts`](../frontend/src/sw.ts). Icons at 192×192, 512×512, and 512×512 maskable are generated from the SVG sources by `npm -w frontend run icons`.
- **App-shell visible offline** — `NetworkFirst` strategy with a 3-second network timeout falls back to the precached `index.html`; an [`OfflineBanner`](../frontend/src/components/OfflineBanner.tsx) explains the state.
- **Queued database inserts** — [`offlineQueue.ts`](../frontend/src/lib/offlineQueue.ts) backs offline chat sends and study edits with IndexedDB. The `online` event flushes the queue via [`queueProcessor.ts`](../frontend/src/lib/queueProcessor.ts). This is exactly the example the spec calls out ("queued database inserts").
- **Server-initiated notifications** — Firebase Cloud Messaging (Web Push). Service worker `push` handler is in [`src/sw.ts`](../frontend/src/sw.ts); the backend sender is [`routes/notify.ts`](../backend/src/routes/notify.ts) plus [`services/scheduler.ts`](../backend/src/services/scheduler.ts). The dashboard has a ministry-leader-only "Send test push now" button so the demo can visibly trigger a server push on camera.
- **HTTPS** — GKE Ingress + Google-managed certificate ([`k8s/ingress.yaml`](../k8s/ingress.yaml)).

## Authentication and Security

- **Auth** — Firebase Authentication with Google sign-in (hashing-by-proxy clause). Frontend uses `signInWithPopup` ([`lib/firebase.ts`](../frontend/src/lib/firebase.ts)). Backend verifies every `Authorization: Bearer <Firebase ID token>` on every `/api/*` call via Admin SDK ([`middleware/verifyFirebaseToken.ts`](../backend/src/middleware/verifyFirebaseToken.ts)).
- **Mitigations**
  - **XSS** — React auto-escapes by default. An ESLint rule ([`.eslintrc.cjs`](../frontend/.eslintrc.cjs)) bans `dangerouslySetInnerHTML`. nginx ships strict security headers (`X-Content-Type-Options nosniff`, `X-Frame-Options DENY`, `Referrer-Policy strict-origin-when-cross-origin`, `Permissions-Policy` denying camera/mic/geolocation by default).
  - **Injection** — every `/api` body is parsed and validated by Zod schemas ([`routes/ai.ts`](../backend/src/routes/ai.ts), [`routes/notify.ts`](../backend/src/routes/notify.ts)). Firestore SDK queries are parameterised by their typed API — no string concatenation, no SQL surface. Gemini's `/api/ai/ask` cannot widen visibility because the backend force-injects role-scope into every function-call tool invocation ([`services/firestoreTools.ts`](../backend/src/services/firestoreTools.ts)).
  - **CSRF** — **the API uses bearer tokens, not cookies, and the backend issues no ambient credential**. Without an ambient cookie there is nothing for a third-party site to ride, so classic CSRF does not apply to this API surface. We document this honestly rather than fabricate a CSRF "mitigation" that doesn't really exist. Helmet + CORS allowlist still apply.
- **Helmet** — global `helmet()` middleware ([`server.ts`](../backend/src/server.ts)).
- **Rate limiting** — `express-rate-limit` at 60 req/min/IP on `/api/*`.
- **Secrets** — `.env.example` only in the repo; real values live in GitHub Actions secrets and Kubernetes Secrets. `.gitignore` blocks `.env*`, `service-account*.json`, etc.

## Backend and Persistent Data

- **Database** — Firestore in native mode. The official Firebase JS SDK on the frontend and the Firebase Admin SDK on the backend act as our ODM (the spec explicitly accepts the Firestore SDK as the ODM).
- **Justification** — chat is naturally real-time, the data is hierarchical (campus → bibleTalk → users, invitees, studies), the free tier covers a class demo, and security rules give us declarative role-based multi-tenancy that's unit-testable.
- **Billing alerts** — set up in the GCP console at $5 / $10 / $20 thresholds (see [`SETUP.md`](SETUP.md)). The spec explicitly requires this for Firebase users.

## AI

- **Provider** — Gemini 2.5 Flash via `@google/generative-ai`. Free tier covers all class-demo traffic.
- **Two features behind `/api/ai/*`** — both Firebase-token-gated, rate-limited, Zod-validated.

  1. **`/api/ai/next-study`** ([`routes/ai.ts`](../backend/src/routes/ai.ts)) — given an `inviteeId`, looks up the invitee's `currentStudyIndex`, computes the next curriculum step, and asks Gemini for a 1–2 sentence personalised follow-up message the leader can paste in chat. Surfaced on the Invitee Profile and on the dashboard "Needs follow-up" list.
  2. **`/api/ai/ask`** — natural-language Q&A using Gemini function-calling. Three typed tools (`listStudies`, `countStudies`, `listInvitees`) defined in [`services/firestoreTools.ts`](../backend/src/services/firestoreTools.ts). The backend clamps every tool call to the caller's role (member → bibleTalk, btLeader → campus, ministryLeader → all). Answers questions like "How many Light and Darkness studies this week and what are their names?", "Which bible talks haven't scheduled any studies this week?", "Who is leading the most studies this month?". Live in the Dashboard's "Ask MinistryBot" panel.

## Systems and Deployment

- **GKE** — 2 e2-micro nodes, two Deployments (`frontend`, `backend`) each with `replicas: 2` ([`k8s/`](../k8s/)). Rolling updates with `maxUnavailable: 0` so the demo URL never goes dark during a deploy.
- **Self-healing demo** — `kubectl -n ministry delete pod -l app=backend --field-selector=status.phase=Running --grace-period=0 --force` then `kubectl -n ministry get pods -w` shows the ReplicaSet recreating it in ~15 seconds.
- **Manual scaling demo** — `kubectl -n ministry scale deploy/backend --replicas=4` then back to `--replicas=2`. (The HPA in [`k8s/hpa.yaml`](../k8s/hpa.yaml) would auto-scale on CPU, but we demo manual scaling per the spec.)
- **Load balancer** — `kubectl -n ministry get ingress ministry-ingress` returns the LB IP. The demo opens that IP in a browser in a single continuous take to prove the app is genuinely running on GKE.
- **CI/CD** — two GitHub Actions workflows:
  - [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on PR and push: install → lint → typecheck → unit tests → build (frontend + backend).
  - [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs on push to `main`: the CI checks, then authenticates to GCP via Workload Identity Federation (no long-lived JSON keys), builds and pushes both Docker images to Artifact Registry (tagged with the commit SHA), renders the k8s manifests with the new image tags + domain, and `kubectl apply`s them with a `kubectl rollout status` wait.
  - Logs visibly show **build**, **test**, and **deploy** as three distinct stages. Two successful run logs are saved to [`/logs/`](../logs/).

## AI usage itemization

The spec asks us to itemise where AI was used in producing the code. This table records every place AI assistance materially contributed.

| Area                                | Tool used        | What AI did                                                                                                | Human verification                                                                          |
| ----------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Initial scaffolding                 | Cursor (Claude)  | Generated the monorepo structure, Vite + Tailwind config, base Express server.                             | Manual review of every config file; ran `npm run typecheck` + `npm run lint` + `npm test`.  |
| Firestore security rules            | Cursor (Claude)  | Drafted the rules file from the role hierarchy description.                                                | Wrote `@firebase/rules-unit-testing` tests in [`backend/test/rules/`](../backend/test/rules) that cover member / BT-leader / ministry-leader scoping. Tests must pass. |
| Canvas heatmap drawing              | Cursor (Claude)  | Wrote the initial draw routine, HSL interpolation, hit-testing.                                            | Visually inspected at 320/768/1024px breakpoints. Cross-checked counts against the `<table>` mirror. |
| Gemini function-calling integration | Cursor (Claude)  | Generated the tool declarations + the chat-loop that handles `functionCalls()`.                            | Unit-tested in [`backend/test/ai.routes.test.ts`](../backend/test/ai.routes.test.ts) with Gemini mocked. Role-scope clamping verified manually with member / BT-leader / ministry-leader test users. |
| ARIA + accessibility patterns       | Cursor (Claude)  | Suggested ARIA live regions, skip links, focus-management on route changes.                                | Manual screen-reader spot-check with VoiceOver / NVDA. axe-core DevTools audit clean.       |
| GitHub Actions YAML                 | Cursor (Claude)  | Drafted the two workflows including Workload Identity Federation auth.                                     | The deploy workflow itself runs successfully on `main` — see [`/logs/`](../logs/).          |

In keeping with the spec's "Vibe and Verify" policy, every file in this repo was reviewed and either accepted, edited, or rewritten by a human. No AI-generated code is committed unread.
