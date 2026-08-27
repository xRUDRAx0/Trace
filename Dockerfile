# ============================================================
# TRACE Backend — Production Dockerfile
# Base image includes Node.js, Chromium, and all OS dependencies
# ============================================================
FROM mcr.microsoft.com/playwright:v1.62.1-noble

WORKDIR /app

# Copy backend dependencies definition
COPY backend/package*.json ./

# Install production dependencies
RUN npm install

# Copy backend source code and config
COPY backend/ ./

# Verify TypeScript build
RUN npm run build

# Default environment configuration
ENV NODE_ENV=production
ENV PORT=3001
ENV PLAYWRIGHT_HEADLESS=true

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

CMD ["npm", "start"]
