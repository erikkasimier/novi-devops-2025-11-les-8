# Multi-stage build voor optimale image size
FROM node:22-alpine AS builder

WORKDIR /app

# Kopieer package files eerst (voor caching)
COPY package*.json ./

# Installeer dependencies
RUN npm ci --only=production

# Production stage
FROM node:22-alpine

WORKDIR /app

# Kopieer alleen wat nodig is
COPY --from=builder /app/node_modules ./node_modules
COPY src/ ./

# Maak non-root user aan
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start applicatie
CMD ["node", "index.js"]
