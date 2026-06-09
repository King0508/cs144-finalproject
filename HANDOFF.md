# HANDOFF — what's left for CS 144 final

Single source of truth for "what still needs to happen" so this project can be picked up on a different computer without re-discovering context. Read this first; everything else cross-references existing docs.

Repo: <https://github.com/King0508/cs144-finalproject>

---

## A. Status snapshot (as of last commit)

- **Code**: feature-complete per [`REQUIREMENTS.md`](REQUIREMENTS.md). React PWA, Express backend, Firebase Auth, Firestore rules, Gemini function-calling, Dockerfiles, k8s manifests, two GitHub Actions workflows — all written and merged to `main`.
- **CI** (`.github/workflows/ci.yml`): green.
- **Deploy / Build & test**: green.
- **Deploy / Build images & deploy to GKE**: **failing**. Root cause is **not** the workflow YAML — it's that the GCP infrastructure it tries to deploy to doesn't exist yet. The `kubectl ... connection refused localhost:8080` line you see in the Actions log is from the final `Show final state` step (`if: always()`), which runs after an earlier step (most likely `Authenticate to Google Cloud` or `Get GKE credentials`) has already failed and left kubectl with no kubeconfig.
- **GCP infra**: project + Firebase Auth + Firestore exist. **No GKE cluster, no Artifact Registry, no Workload Identity Federation pool.**
- **Domain**: none yet (HTTPS requires one).
- **Gemini**: live errors haven't been root-caused yet. The latest commit added an error `details` field to `/api/ai/*` 500 responses ([`backend/src/routes/ai.ts`](backend/src/routes/ai.ts)) so the actual message will be visible in the browser once you redeploy.

## B. New-computer bootstrap

```bash
git clone https://github.com/King0508/cs144-finalproject.git
cd cs144-finalproject
npm install

# Frontend env (7 VITE_FIREBASE_* values from Firebase Console → Project settings → Your apps → frontend)
cp frontend/.env.example frontend/.env.local
$EDITOR frontend/.env.local

# Backend env: FIREBASE_PROJECT_ID, GEMINI_API_KEY, GOOGLE_APPLICATION_CREDENTIALS
cp backend/.env.example backend/.env
$EDITOR backend/.env

# Service account JSON (gitignored, must be re-downloaded on each machine):
#   Firebase Console → Project settings → Service accounts → Generate new private key
#   Move the downloaded JSON to backend/service-account.json

# Optional: seed example campuses/talks/invitees/studies if Firestore is empty
npm -w backend run seed

npm run dev   # frontend http://localhost:5173, backend http://localhost:8080
```

### Tools required on the machine

- Node.js 22
- `gcloud` CLI (https://cloud.google.com/sdk/docs/install)
- `kubectl` (`gcloud components install kubectl` is easiest)
- `firebase-tools` (`npm install -g firebase-tools`) — only needed if redeploying Firestore rules/indexes
- Docker Desktop — only if you want to build container images locally

After install: `gcloud auth login` and `firebase login`.

## C. Remaining work, in execution order

Check items off as you go.

### Critical path (Jun 10 — 70 pts)

- [ ] **GCP one-time infra.** Run every command in [`docs/SETUP.md`](docs/SETUP.md) §1 (enable APIs only — project already exists), §5 (Artifact Registry), §6 (GKE cluster + reserved static IP `ministry-ip`), §7 (Workload Identity Federation pool/provider + IAM bindings). Skip §2 (Firebase already set up) and §3–§4 (env files already done locally).
- [ ] **Buy a domain.** Cheapest legit options: Cloudflare Registrar (~$10/yr, no markup), Porkbun, Namecheap. Create an `A` record like `ministry.<yourdomain>` pointing at the IP printed by `gcloud compute addresses describe ministry-ip --global --format="get(address)"`. DNS + Google-managed cert provisioning can take 15–60 min after the Ingress is up.
- [ ] **15 GitHub Actions secrets.** Settings → Secrets and variables → Actions → New repository secret. Exact list and where each value comes from is in [`docs/SETUP.md`](docs/SETUP.md) §8 table. The workflow silently fails if any are missing.
- [ ] **In-cluster Secrets.** Two `kubectl create secret` commands in [`docs/SETUP.md`](docs/SETUP.md) §9 — `backend-config` (FIREBASE_PROJECT_ID, GEMINI_API_KEY, CORS_ALLOW_ORIGIN) and `backend-service-account` (the JSON file). Backend pods crash-loop without these.
- [ ] **Trigger deploy.** `git commit --allow-empty -m "trigger deploy" && git push origin main`. Watch the run at <https://github.com/King0508/cs144-finalproject/actions>.
- [ ] **Verify pods + ingress.** `kubectl -n ministry get pods -o wide` (expect 2 backend + 2 frontend, all Running), `kubectl -n ministry get ingress` (LB IP populated). Open `https://<APP_DOMAIN>` and sign in.
- [ ] **Diagnose Gemini** (if it errors). The new error `details` from `[backend/src/routes/ai.ts](backend/src/routes/ai.ts)` will show in the browser's Ask MinistryBot panel. Triage table in Section D.
- [ ] **Promote a demo account to `ministryLeader`.** Required for the "Send test push" demo button. `npm -w backend run promote -- you@example.com` (after signing in once so `/users/<uid>` exists). See [`README.md`](README.md) "Become a ministry leader".
- [ ] **GCP billing alerts.** Spec explicitly requires this for Firebase users. Console → Billing → Budgets & alerts → create at $5, $10, $20.
- [ ] **Record the demo** in one continuous take, no cuts. Shot-list in Section E.
- [ ] **Submit to Gradescope by Jun 10 11:59 PM** — repo link + recording. (70 pts)

### Final paperwork (Jun 12 — 30 pts)

- [ ] **Capture CI/CD logs.** Download two successful run logs into [`logs/`](logs/) and commit:
  ```bash
  gh run view <ci-run-id>     --log > logs/ci-<id>.log
  gh run view <deploy-run-id> --log > logs/deploy-<id>.log
  ```
  Or from the Actions UI: click the run → `...` menu → "View raw logs" → save as a file.
- [ ] **Final Gradescope submission by Jun 12 11:59 PM** — repo with `DATABASE.md`, `ARCHITECTURE.md`, `REQUIREMENTS.md`, `README.md`, and `logs/`.

## D. Known issue: Gemini errors

The latest commit (`e9582fd`) added an error `details` field to `/api/ai/*` 500 responses, so the actual error message is now visible in the browser. Most likely root causes, in priority order:

| # | Symptom | Fix |
|---|---------|-----|
| 1 | `details: "GEMINI_API_KEY is required."` | Key missing/empty. Local: edit `backend/.env`. Cluster: re-create `backend-config` Secret per [`docs/SETUP.md`](docs/SETUP.md) §9. |
| 2 | 403 / "API has not been used" | Key was generated in a GCP project where Generative Language API is disabled. Generate a new key at <https://aistudio.google.com/app/apikey> — it auto-enables the API in its own project. |
| 3 | "model not found" / 404 on `gemini-2.5-flash` | Free tier on that key doesn't have 2.5. Edit the `MODEL` constant at [`backend/src/services/gemini.ts`](backend/src/services/gemini.ts) line 5 to `"gemini-1.5-flash"` or `"gemini-2.0-flash-exp"`. One-line change. |
| 4 | 429 / quota exceeded | Free-tier per-minute or per-day cap. Wait, or back off the request rate. |

Don't pre-emptively change the model — only switch when error #3 is the observed message.

## E. Demo shot-list (single continuous take)

Spec is explicit this must be one take with no cuts (so graders can verify it's actually on GKE). Have two windows ready: browser + terminal.

1. **Sign in** with Google (auth requirement).
2. **Onboarding** — pick campus + bible talk.
3. **Bible-talk chat** — open a chat, send a message (real-time Firestore).
4. **Studies page** — create a new study (form validation, Firestore write).
5. **Calendar** — drag a study card to a different day/hour. Briefly demo keyboard fallback (Shift + arrow keys) to cover the accessibility requirement.
6. **Dashboard** — show the canvas heatmap, hover for tooltip. Ask MinistryBot a question like "How many studies this week?". Open an invitee and show the AI follow-up message suggestion.
7. **PWA offline** — DevTools → Network → Offline. Send a chat message (queues to IndexedDB → see [`frontend/src/lib/offlineQueue.ts`](frontend/src/lib/offlineQueue.ts)). Toggle Online. Watch the queued message flush.
8. **Server push** — click "Send test push" on the dashboard (ML-only button). Notification lands on screen.
9. **GKE self-healing** — switch to terminal: `kubectl -n ministry delete pod -l app=backend --force --grace-period=0`. Then `kubectl -n ministry get pods -w` and show the ReplicaSet recreating the pod in ~15s.
10. **Manual scaling** — `kubectl -n ministry scale deploy/backend --replicas=4` then `kubectl -n ministry get pods`. Scale back: `kubectl -n ministry scale deploy/backend --replicas=2`.
11. **Load balancer** — `kubectl -n ministry get ingress` and read the LB IP on camera.
12. **Open `https://<APP_DOMAIN>`** in a fresh browser tab in the **same take**. This is the spec's hard requirement to prove the app is genuinely on GKE, not localhost.

## F. Things NOT to touch / known-good

- `.gitignore` blocks `service-account*.json` and `.env*` correctly. Verified by `git ls-files`.
- All k8s manifests in [`k8s/`](k8s/) are correct — image tags are `IMAGE_PLACEHOLDER_*` placeholders that `.github/workflows/deploy.yml` rewrites with the commit SHA before `kubectl apply`.
- Both workflow files are correct — they only need the secrets and infra to exist.
- `ConsentBanner` is already mounted in [`frontend/src/App.tsx`](frontend/src/App.tsx) — it'll auto-show on first visit. No code change needed; just make sure it appears in the recording.

## G. Open decisions for future-you

- **Domain registrar choice** — Cloudflare unless you have an existing account elsewhere.
- **e2-micro vs e2-small** — start with e2-micro per spec. If pods stick `Pending` (out of memory), the spec explicitly allows `e2-small` with instructor notification.
- **Whether to use the HPA** — `k8s/hpa.yaml` is committed but the spec asks for *manual* scaling in the demo. Leave HPA applied; just demo `kubectl scale` on camera.

## H. Operations runbook: promoting / demoting users

By default every Google sign-in lands as `role: "member"`. Firestore rules at [`firestore/firestore.rules`](firestore/firestore.rules) deliberately block self-promotion, so changing someone's role always goes through one of these paths.

### Role hierarchy semantics

| Role | Scope (Firestore rules + AskBot tools enforce this) |
|---|---|
| `member` | Their single bible talk |
| `btLeader` | All bible talks within their campus |
| `ministryLeader` | All campuses |

A user **must have signed into the app once** before any path will work — that's what creates `/users/{uid}` in Firestore. The Auth user is created by the Google popup; the Firestore stub is created on first navigation.

### Path A — `promote` script (preferred, scriptable)

Requires repo access + `backend/service-account.json` on the machine. Implemented at [`backend/scripts/promote.ts`](backend/scripts/promote.ts).

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = ".\backend\service-account.json"
$env:FIREBASE_PROJECT_ID = "ministry-pwa-king"
npm -w backend run promote -- new-leader@example.com
# optional second arg: member | btLeader | ministryLeader (defaults to ministryLeader)
npm -w backend run promote -- some-user@example.com btLeader
```

Idempotent — re-running with the same role is a no-op. Tell the user to hard-refresh after; the client picks up the new role on the next `onSnapshot` tick.

### Path B — Firebase Console (no terminal, no code)

Good for one-off promotions or when you don't have the repo handy.

1. [Firebase Console → Authentication](https://console.firebase.google.com/project/ministry-pwa-king/authentication/users) → search for the user's email → copy the UID.
2. [Firebase Console → Firestore](https://console.firebase.google.com/project/ministry-pwa-king/firestore/data/~2Fusers) → `users/{uid}` → click the `role` field → set it to `member`, `btLeader`, or `ministryLeader`.
3. (Optional, for btLeader / member) Confirm `campusId` and `bibleTalkId` are set on the same document — without those, the rules will give the user no scope and the app will show empty lists.
4. Tell the user to hard-refresh.

### Path C — In-app (existing ML promotes another user)

The Firestore rules already permit an existing `ministryLeader` to write `role` on any user document, but **the UI for it isn't wired up today**. The "Send test push" button is currently the only thing in [`frontend/src/components/dashboard/MinistryToolsPanel.tsx`](frontend/src/components/dashboard/MinistryToolsPanel.tsx). Adding a "Manage roles" form is a small, well-scoped follow-up feature — drop a `<select>` next to a user search, write the new role via `updateDoc`, done.

### Demoting

Same paths in reverse — change the role string to `member`. The promote script accepts any of the three role names; no separate `demote` command needed.

### Common errors

| Error | Cause | Fix |
|---|---|---|
| `[promote] no Firebase Auth user with that email` | They've never signed in | Ask them to visit the app and complete Google sign-in once, then re-run. |
| `[promote] /users/{uid} does not exist yet` | They signed in but `useUserDoc` hasn't created the stub | Ask them to navigate to any page after sign-in (the stub creation happens client-side on first read), then re-run. |
| `Missing or insufficient permissions` writing role in Console | You're signed into Firebase Console with a different Google account than the project owner | Switch to the project owner's account in the top-right Firebase Console menu. |
| User still sees old nav after promotion | Client cache | Hard-refresh (Ctrl+Shift+R). Firestore `onSnapshot` will deliver the new role within seconds. |
