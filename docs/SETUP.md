# Setup Walkthrough

You said you've never used GCP before, so this is a step-by-step. Everything here is one-time setup. You only do it once and then `git push` ships the app.

> All commands assume PowerShell on Windows. Bash equivalents are the same minus `$env:` prefixes.

## 0. Tools you need installed locally

- [Node.js 22](https://nodejs.org/) (you already have it)
- [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install)
- [`kubectl`](https://kubernetes.io/docs/tasks/tools/) — easiest: `gcloud components install kubectl`
- [Firebase CLI](https://firebase.google.com/docs/cli) — `npm install -g firebase-tools`
- Docker Desktop (only if you want to test container builds locally)

After installing, run `gcloud auth login` and `firebase login`.

## 1. Create a GCP project

```powershell
$env:GCP_PROJECT_ID = "ministry-pwa-<your-name>"     # must be globally unique
gcloud projects create $env:GCP_PROJECT_ID --name="Ministry PWA"
gcloud config set project $env:GCP_PROJECT_ID

# Link billing to your project (uses your education coupon).
# Find your billing-account id with: gcloud billing accounts list
gcloud billing projects link $env:GCP_PROJECT_ID --billing-account=<billing-account-id>
```

### Set billing alerts (REQUIRED by the spec for Firebase users)

In the GCP Console: **Billing → Budgets & alerts → Create budget**.
Set thresholds at `$5`, `$10`, and `$20` and email yourself on each. Document in your final writeup that this is done.

### Enable the APIs we need

```powershell
gcloud services enable `
  container.googleapis.com `
  artifactregistry.googleapis.com `
  cloudbuild.googleapis.com `
  firebase.googleapis.com `
  firestore.googleapis.com `
  iamcredentials.googleapis.com `
  fcm.googleapis.com `
  iam.googleapis.com `
  cloudresourcemanager.googleapis.com
```

## 2. Set up Firebase (Auth + Firestore + Cloud Messaging)

1. Open https://console.firebase.google.com and click **Add project** — pick the GCP project you just created. (Don't create a new one — you want the existing project.)
2. **Build → Authentication → Get started → Sign-in method → Google** — enable it. Pick a public-facing support email.
3. **Build → Firestore Database → Create database → Native mode → us-central1** (or your closest region).
4. **Project settings (gear) → Your apps → Add app → Web** — register a web app called "frontend". Copy the config object — you'll paste these values into `frontend/.env.local`.
5. **Project settings → Cloud Messaging → Web configuration → Generate key pair** — this is the VAPID key. Copy it.

### Service account for the backend

1. **Project settings → Service accounts → Generate new private key** — saves a JSON file. Move it to `backend/service-account.json` (already in `.gitignore`).

### Deploy the security rules + indexes

```powershell
cd <repo root>
firebase use $env:GCP_PROJECT_ID
firebase deploy --only firestore:rules,firestore:indexes
```

## 3. Fill in local .env files

```powershell
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Edit `frontend/.env.local` with the Firebase Web config values from step 2.4 + the VAPID key from step 2.5.

Edit `backend/.env` with `FIREBASE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json`, and your **Gemini API key** (free, from https://aistudio.google.com/app/apikey).

## 4. Seed example data and run locally

```powershell
npm install
npm -w backend run seed       # creates UCLA/USC campuses, 5 bible talks, 7 invitees, ~6 studies
npm run dev                   # frontend on :5173, backend on :8080
```

Open http://localhost:5173, sign in with Google, pick a campus + bible talk on the onboarding screen, and you're in.

### Make yourself a ministry leader (for the demo)

You sign in as a `member` by default. To get the full dashboard + the "Send test push" button, promote yourself manually in the Firebase console:

**Firestore → users/{your-uid} → role** → change to `"ministryLeader"`. (In a real deploy a senior pastor would do this.)

## 5. Set up Artifact Registry (one time)

```powershell
$env:GCP_REGION = "us-central1"
gcloud artifacts repositories create ministry `
  --repository-format=docker `
  --location=$env:GCP_REGION `
  --description="Ministry PWA container images"
```

## 6. Create the GKE cluster (one time)

```powershell
$env:GKE_CLUSTER = "ministry-gke"
$env:GKE_ZONE = "us-central1-a"

gcloud container clusters create $env:GKE_CLUSTER `
  --zone=$env:GKE_ZONE `
  --num-nodes=2 `
  --machine-type=e2-micro `
  --release-channel=stable `
  --enable-autoupgrade `
  --enable-autorepair

# Reserve a global static IP for the Ingress (so the cert doesn't churn).
gcloud compute addresses create ministry-ip --global
```

Get the IP and point an A record at it (or wait for the instructor to give you a domain that already points at the right IP — then edit `k8s/ingress.yaml` and the `APP_DOMAIN` GitHub secret).

```powershell
gcloud compute addresses describe ministry-ip --global --format="get(address)"
```

## 7. Set up Workload Identity Federation (so GitHub Actions can deploy)

This is the modern, key-less way to let GitHub Actions assume a service account. No JSON keys committed anywhere.

```powershell
# 7.1 Create a service account for deploys
gcloud iam service-accounts create gha-deployer `
  --display-name="GitHub Actions deployer"

$env:DEPLOYER_SA = "gha-deployer@$env:GCP_PROJECT_ID.iam.gserviceaccount.com"

# 7.2 Grant it the roles it needs
foreach ($role in @("roles/container.developer","roles/artifactregistry.writer","roles/iam.serviceAccountTokenCreator","roles/storage.admin")) {
  gcloud projects add-iam-policy-binding $env:GCP_PROJECT_ID `
    --member="serviceAccount:$env:DEPLOYER_SA" --role=$role | Out-Null
}

# 7.3 Create the WIF pool + provider
gcloud iam workload-identity-pools create github-pool `
  --location=global --display-name="GitHub Actions"
gcloud iam workload-identity-pools providers create-oidc github-provider `
  --location=global --workload-identity-pool=github-pool `
  --display-name="GitHub OIDC" `
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" `
  --attribute-condition="assertion.repository_owner == '<your-github-org-or-user>'" `
  --issuer-uri="https://token.actions.githubusercontent.com"

# 7.4 Bind your repo to the deployer service account
$env:GH_REPO = "<owner>/<repo>"
$env:PROJECT_NUMBER = gcloud projects describe $env:GCP_PROJECT_ID --format="get(projectNumber)"
gcloud iam service-accounts add-iam-policy-binding $env:DEPLOYER_SA `
  --role=roles/iam.workloadIdentityUser `
  --member="principalSet://iam.googleapis.com/projects/$env:PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/$env:GH_REPO"

# Print the values you'll paste into GitHub secrets:
Write-Host "GCP_WIF_PROVIDER = projects/$env:PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
Write-Host "GCP_DEPLOYER_SA  = $env:DEPLOYER_SA"
```

## 8. Add GitHub Actions secrets

In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**. Add:

| Secret name                          | Value                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `GCP_PROJECT_ID`                     | your project id                                                        |
| `GCP_REGION`                         | e.g. `us-central1`                                                     |
| `GKE_CLUSTER`                        | `ministry-gke`                                                         |
| `GKE_ZONE`                           | e.g. `us-central1-a`                                                   |
| `AR_REPO`                            | `ministry`                                                             |
| `GCP_WIF_PROVIDER`                   | printed by step 7.4                                                    |
| `GCP_DEPLOYER_SA`                    | printed by step 7.4                                                    |
| `APP_DOMAIN`                         | the hostname for HTTPS (e.g. `ministry.yourdomain.dev`)                |
| `VITE_FIREBASE_API_KEY`              | from Firebase console                                                  |
| `VITE_FIREBASE_AUTH_DOMAIN`          | from Firebase console                                                  |
| `VITE_FIREBASE_PROJECT_ID`           | same as `GCP_PROJECT_ID`                                               |
| `VITE_FIREBASE_STORAGE_BUCKET`       | from Firebase console                                                  |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`  | from Firebase console                                                  |
| `VITE_FIREBASE_APP_ID`               | from Firebase console                                                  |
| `VITE_FIREBASE_VAPID_KEY`            | from Firebase console (Cloud Messaging → Web configuration)            |

## 9. Create the in-cluster Secrets the backend reads

```powershell
gcloud container clusters get-credentials $env:GKE_CLUSTER --zone=$env:GKE_ZONE
kubectl create namespace ministry

# Backend env vars
kubectl -n ministry create secret generic backend-config `
  --from-literal=FIREBASE_PROJECT_ID=$env:GCP_PROJECT_ID `
  --from-literal=GEMINI_API_KEY="<your gemini api key>" `
  --from-literal=CORS_ALLOW_ORIGIN="https://<your APP_DOMAIN>"

# Backend service-account JSON (used by Firebase Admin SDK in-cluster)
kubectl -n ministry create secret generic backend-service-account `
  --from-file=service-account.json=./backend/service-account.json
```

## 10. First deploy

```powershell
git push origin main
```

Watch the run at https://github.com/<owner>/<repo>/actions. When it goes green, `kubectl -n ministry get ingress` will show the LB IP. Open `https://<APP_DOMAIN>` in a browser — you should see the Login screen.

## 11. Recording the demo

Follow [`docs/REQUIREMENTS.md`](REQUIREMENTS.md) → "GKE" section for the kubectl commands; do them in one continuous take. Order matters per the spec — login → onboarding → chat → study creation → calendar drag → dashboard heatmap → AI features → offline + reconnect → push notification → kubectl delete pod → kubectl scale → `kubectl get ingress` → open the LB IP in a browser.

## Recovering from common errors

| Symptom                                                                   | Fix                                                                                                                            |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| "Missing Firebase config" in dev                                          | You forgot to copy `frontend/.env.example` to `frontend/.env.local` and fill it in.                                            |
| Backend logs "Could not load default credentials"                         | `backend/.env` needs `GOOGLE_APPLICATION_CREDENTIALS` pointing at the service-account JSON.                                    |
| Sign-in popup is blocked                                                  | Pop-ups must be allowed for `localhost:5173`. If you're not at that origin, add it under Firebase Auth → Settings → Authorized domains. |
| AskBot returns "Out of scope"                                              | Your user doc has `role: "member"` but no `bibleTalkId`. Finish onboarding first.                                              |
| Pods stuck `Pending` on the e2-micro nodes                                | The two micro nodes are out of RAM. Either trim `resources.requests` further or upgrade to e2-small (the spec allows with notification). |
| GitHub Actions auth fails with `permission_denied`                        | The WIF binding in step 7.4 didn't take. Double-check `repository_owner` matches your GitHub user/org.                         |
