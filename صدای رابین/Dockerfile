# Stage 1: Base image
FROM node:18-alpine AS base

# Install minimal system dependencies
RUN apk add --no-cache \
    libc6-compat \
    curl \
    bash

# Set locale and encoding
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

WORKDIR /app

# مرحله 2: Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm install --only=production --prefer-offline --no-audit --progress=false

# مرحله 3: Builder
FROM base AS builder
COPY package*.json ./

# نصب dependencies با تنظیمات بهینه
RUN npm install --prefer-offline --no-audit --progress=false

# کپی کل پروژه (به جز .env که از docker-compose می‌آید)
COPY . .

# حذف .env اگر وجود داشته باشد (برای امنیت)
RUN rm -f .env 2>/dev/null || true

# Build با memory بهینه‌شده
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true

# Build Next.js
RUN npm run build

# مرحله 4: Runner
FROM base AS runner
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create necessary directories
RUN mkdir -p /app/logs /app/public

# کپی فایل‌های public (if exists)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# کپی standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app/logs /app/public && \
    chmod -R 755 /app/logs /app/public

USER nextjs

EXPOSE 3001
ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Copy start script
COPY --chown=nextjs:nodejs ./start.sh ./start.sh
RUN chmod +x ./start.sh

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R nextjs:nodejs logs

# Start both Express API and Next.js server
CMD ["./start.sh"]