# Stage 1: Base image
FROM node:18-alpine AS base

# Install minimal system dependencies
RUN apk add --no-cache \
    libc6-compat \
    curl \
    bash

WORKDIR /app

# Create necessary directories
RUN mkdir -p /app/debug /app/scripts /app/logs

# مرحله 2: Dependencies
FROM base AS deps
COPY package*.json ./
RUN if [ -f "package-lock.json" ]; then \
        npm ci --only=production --prefer-offline --no-audit --progress=false; \
    else \
        npm install --only=production --prefer-offline --no-audit --progress=false; \
    fi

# مرحله 3: Builder
FROM base AS builder
COPY package*.json ./

# نصب dependencies با تنظیمات بهینه
RUN if [ -f "package-lock.json" ]; then \
        npm ci --prefer-offline --no-audit --progress=false --maxsockets 1; \
    else \
        npm install --prefer-offline --no-audit --progress=false --maxsockets 1; \
    fi

# کپی کل پروژه
COPY . .

# Build با memory بهینه‌شده و تنظیمات بهینه
ENV NODE_OPTIONS="--max-old-space-size=1536 --max-semi-space-size=64"
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true

# Build با memory بهینه
RUN npm run build:server || npm run build || npm run build:memory-safe

# مرحله 4: Runner
FROM base AS runner
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# کپی فایل‌های public
COPY --from=builder /app/public ./public

# Create necessary directories
RUN mkdir -p /app/debug /app/logs /app/scripts

# کپی standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app/debug /app/logs /app/scripts

# Make debug scripts executable
RUN chmod +x *.sh 2>/dev/null || true

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]