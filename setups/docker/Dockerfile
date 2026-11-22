# Multi-stage Docker build for GeoGebra MCP Tool
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build TypeScript to dist/
RUN npm run build

# --- Production Image ---
FROM node:20-bullseye-slim

WORKDIR /app

# Install Chrome headless shell runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer environment variables to use installed chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    LOG_LEVEL=info

# Copy production dependencies and built files
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Non-root user for security
USER node

# Use dumb-init to properly handle signal termination
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Default to stdio MCP transport
CMD ["node", "dist/index.js"]
