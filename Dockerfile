# ==============================================================================
# Multi-stage production build for CrisisGrid AI
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including build tools)
RUN npm ci

# Copy source files
COPY . .

# Build Vite client assets into dist/
RUN npm run build

# ==============================================================================
# Production runtime runner
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled frontend and application server files
COPY --from=builder /app/dist ./dist
COPY server.ts ./
COPY tsconfig.json ./
COPY firebase-applet-config.json ./
COPY metadata.json ./

# Expose standard Render web port
EXPOSE 10000

# Start server using tsx
CMD ["npm", "start"]
