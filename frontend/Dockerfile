
# Stage 1: Build the React PWA. We copy both workspace package.json files in
# first so `npm ci` is cacheable across code changes.
FROM node:22-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install only the frontend workspace's deps.
RUN npm ci --workspace=frontend --include-workspace-root || npm install --workspace=frontend

COPY frontend ./frontend

# At build time the VITE_FIREBASE_* values are baked into the bundle.
# Provide them via --build-arg from the CI deploy job.
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_VAPID_KEY
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_FIREBASE_VAPID_KEY=$VITE_FIREBASE_VAPID_KEY

RUN npm -w frontend run icons || echo "[warn] icon generation skipped"
RUN npm -w frontend run build

# Stage 2: Serve the built static SPA with nginx.
FROM nginx:1.27-alpine
COPY --from=build /repo/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
