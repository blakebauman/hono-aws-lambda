# Multi-stage Dockerfile for Hono AWS Lambda API
# Supports both development (with hot-reload) and production builds

FROM oven/bun:1.1 AS base

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json bun.lock bunfig.toml ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/infrastructure/package.json ./packages/infrastructure/

# Install dependencies
RUN bun install --frozen-lockfile

# Development stage
FROM base AS development

# Copy all source code
COPY . .

# Expose port
EXPOSE 3000

# Default command for development (with hot-reload)
CMD ["bun", "run", "--filter=api", "dev"]

# Production stage
FROM base AS production

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Expose port
EXPOSE 3000

# Production command
CMD ["bun", "run", "packages/api/src/index.ts"]

