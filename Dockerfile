# syntax=docker/dockerfile:1
FROM node:20-slim AS builder

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

RUN npm ci

# Copy backend source code
COPY backend/ ./

# Pre-seed embedded database during build so fallback DB has all CNHS accounts
RUN npm run seed

# Build production TypeScript code
RUN npm run build

# Runner stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

COPY backend/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/schema.sql ./dist/database/schema.sql
COPY --from=builder /app/cnhs_extracurricular.db ./cnhs_extracurricular.db

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

CMD ["node", "dist/server.js"]
