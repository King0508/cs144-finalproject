# Campus Ministry PWA

A Progressive Web App tailored to campus Christian ministries: bible-talk group chats plus a curriculum-aware bible-study scheduling and calendar system, deployed to Google Kubernetes Engine.

CS 144 final project (Spring 2026) — Prof. Rosario.

## Quick links

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — system architecture, components, data flow
- [`REQUIREMENTS.md`](REQUIREMENTS.md) — rubric-by-rubric mapping + AI usage itemization
- [`DATABASE.md`](DATABASE.md) — Firestore collection shapes, indexes, security-rule summary
- [`docs/SETUP.md`](docs/SETUP.md) — full GCP / Firebase / GKE setup walkthrough

## What it does

- **Bible-talk chat** — real-time group chat for every bible talk, backed by Firestore live listeners. Works offline (messages queue in IndexedDB and flush on reconnect).
- **Bible-study scheduling** — create studies with a curriculum study name, date/time, location, Lead, and one or more Supports. Edit any field inline.
- **Weekly calendar** — Google-Calendar-style week view. Drag a study to a new day/hour to reschedule. Keyboard fallback: focus a study and use Shift + arrow keys.
- **Dashboard** — counts per bible talk, per campus, per study. Centerpiece is a hand-drawn **HTML5 Canvas weekly heatmap** showing when studies happen across the week (hue = time of day, intensity = study count).
- **AI assistants** (Gemini 2.5 Flash)
  - **Next-study suggestions** — for any invitee, the app surfaces the next study in the curriculum and Gemini drafts a warm follow-up message the leader can paste in chat.
  - **Ask MinistryBot** — natural-language Q&A using Gemini function-calling over typed Firestore queries. Try "How many Light and Darkness studies this week and what are their names?" Role-scoped: ministry leaders see everything; bible-talk leaders see their campus; members see their bible talk.
- **PWA** — installable on desktop and mobile, works offline, server-initiated Web Push notifications via Firebase Cloud Messaging.
- **Role-based visibility** — Member → bible talk; Bible-talk leader → campus; Ministry leader → all campuses. Enforced in Firestore security rules AND on the backend AskBot tool layer.

## Tech stack

| Layer        | Technology                                                            |
| ------------ | --------------------------------------------------------------------- |
| Frontend     | React 18 + TypeScript + Vite + Tailwind CSS, `vite-plugin-pwa` (Workbox) |
| Real-time    | Firestore `onSnapshot` listeners (chat, calendar, dashboard)          |
| Notifications | Firebase Cloud Messaging (Web Push)                                   |
| Backend      | Node.js 22 + Express + TypeScript (Helmet, Zod, express-rate-limit)   |
| Auth         | Firebase Authentication (Google sign-in) — token verified by Admin SDK |
| AI           | Gemini 2.5 Flash via `@google/generative-ai` (incl. function-calling) |
| Database     | Firestore (native mode)                                               |
| Container    | Docker (multi-stage builds, frontend served by nginx)                 |
| Orchestration | Google Kubernetes Engine (GKE) — 2× e2-micro nodes, 2 replicas per Deployment |
| Ingress      | GKE Ingress + Google-managed certificate (HTTPS)                      |
| CI/CD        | GitHub Actions (lint → typecheck → test → build → push → kubectl apply) |
| Registry     | Google Artifact Registry                                              |

## Local development

```bash
git clone <repo>
cd cs144-finalproject

# 1. Install dependencies
npm install

# 2. Frontend config (see SETUP.md for how to fill these in)
cp frontend/.env.example frontend/.env.local
$EDITOR frontend/.env.local

# 3. Backend config
cp backend/.env.example backend/.env
$EDITOR backend/.env
# Download a Firebase service-account JSON and save it as backend/service-account.json

# 4. Seed example campuses, bible talks, invitees, and studies
npm -w backend run seed

# 5. Run both apps with one command
npm run dev
# Frontend at http://localhost:5173
# Backend  at http://localhost:8080
```

## Become a ministry leader (test the ML view)

Every new sign-in is created as `role: "member"`. Firestore rules deliberately
block self-promotion, so the very first ministry leader has to be promoted
out-of-band via the Admin SDK or the Firebase Console. Pick either path:

**Option A — `promote` script (recommended, repeatable)**

```bash
# After signing in once at http://localhost:5173 so /users/<uid> exists:
GOOGLE_APPLICATION_CREDENTIALS=./backend/service-account.json \
FIREBASE_PROJECT_ID=ministry-pwa-king \
  npm -w backend run promote -- you@example.com
# Optional second arg: member | btLeader | ministryLeader (defaults to ministryLeader)
```

**Option B — Firebase Console (no code, one-shot)**

1. Sign in once with Google at `http://localhost:5173` and complete onboarding
   (any campus + bible talk — ministry leaders skip this step on future
   sign-ins).
2. In the Firebase Console, open Firestore → `users/<your-uid>`. Find your
   uid in the Authentication tab or under "Role" on `/settings` after the
   first refresh.
3. Set `role: "ministryLeader"`. Optionally clear `campusId` / `bibleTalkId`
   for fully cross-campus visibility.
4. Hard-refresh the app. `/settings` will show the new role and (in dev
   builds) a "Switch role" card you can use to hop between
   `member` / `btLeader` / `ministryLeader` views.

## Test, typecheck, lint, build

```bash
npm test            # all unit tests (frontend + backend), no emulator required
npm run lint
npm run typecheck
npm run build

# Firestore rules tests (requires the Firebase CLI + emulator):
#   firebase emulators:exec --only firestore "npm -w backend run test:rules"
```

## Deploying

Pushes to `main` trigger `.github/workflows/deploy.yml`, which:

1. Runs lint + typecheck + tests
2. Authenticates to GCP via Workload Identity Federation (no long-lived JSON keys in the repo)
3. Builds the backend and frontend Docker images, tags them with the commit SHA, and pushes to Artifact Registry
4. Renders k8s manifests with the new image tags + your domain
5. Runs `kubectl apply -f k8s-rendered/` and waits for `rollout status`

See [`docs/SETUP.md`](docs/SETUP.md) for the one-time GCP setup (creating the cluster, Artifact Registry repository, Workload Identity Federation pool, and required GitHub secrets).

## Project structure

```
/frontend                React + Vite + TS + Tailwind PWA
  src/
    pages/               Login, Onboarding, BibleTalkChat, Studies, InviteeProfile, Calendar, Dashboard, Settings
    components/          AppShell, StudyForm, Modal, WeeklyCalendar (drag+drop), WeeklyHeatmapCanvas, AskBotPanel, ConsentBanner, OfflineBanner
    hooks/               useAuth, useUserDoc, useStudies, useInvitees, useBibleTalkMembers
    lib/                 firebase.ts, api.ts, push.ts, offlineQueue.ts, queueProcessor.ts, curriculum.ts, types.ts, registerSW.ts
    sw.ts                Service worker (Workbox + Web Push handler)
  scripts/generate-icons.mjs   SVG → PNG icon generator (sharp)
  Dockerfile             Multi-stage: Vite build → nginx
  nginx.conf             SPA fallback + caching + security headers

/backend                 Node + Express + TS
  src/
    routes/              ai.ts (Gemini), notify.ts (FCM register + test push)
    middleware/          verifyFirebaseToken.ts (Bearer auth), requireMinistryLeader
    services/            gemini.ts, firestoreTools.ts (function-calling tools), scheduler.ts (reminder cron)
    server.ts, firebase.ts, curriculum.ts
  scripts/seed.ts        Seeds example campuses, bible talks, invitees, studies
  Dockerfile             Multi-stage: tsc build → node:slim

/firestore
  firestore.rules        Role-based security rules (member / btLeader / ministryLeader)
  firestore.indexes.json Composite indexes for the queries the app makes

/k8s                     Kubernetes manifests
  namespace.yaml
  backend-deployment.yaml, backend-service.yaml
  frontend-deployment.yaml, frontend-service.yaml
  ingress.yaml           ManagedCertificate + Ingress
  hpa.yaml               Optional HorizontalPodAutoscaler

/.github/workflows
  ci.yml                 Runs on PR and push: lint + typecheck + test + build
  deploy.yml             Runs on main: full pipeline → kubectl apply

/docs                    ARCHITECTURE.md, REQUIREMENTS.md, DATABASE.md, SETUP.md
/logs                    Two successful GitHub Actions run logs (for Gradescope)
```

## License

Coursework for CS 144 (Prof. Rosario). All rights reserved — see [`LICENSE`](LICENSE).
