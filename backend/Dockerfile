FROM node:22-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

RUN npm ci --workspace=backend --include-workspace-root || npm install --workspace=backend

COPY backend ./backend
RUN npm -w backend run build && npm -w backend prune --production

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /repo/backend/dist ./dist
COPY --from=build /repo/backend/package.json ./package.json
COPY --from=build /repo/node_modules ./node_modules

EXPOSE 8080
USER node
CMD ["node", "dist/src/server.js"]
