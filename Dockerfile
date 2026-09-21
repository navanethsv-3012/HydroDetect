# ─── Multi-Stage Production Dockerfile ────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 5000

WORKDIR /app/backend
CMD ["node", "server.js"]
