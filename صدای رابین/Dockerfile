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

# ✅ فقط Express API - بدون Next.js build
ENV NODE_OPTIONS="--max-old-space-size=512"
ENV NODE_ENV=production

# ✅ هیچ build نمی‌خواهیم - فقط Express API

# مرحله 4: Runner
FROM base AS runner
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create necessary directories
RUN mkdir -p /app/logs /app/public

# ✅ کپی فقط چیزهایی که برای Express API لازم است
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/api ./api
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# ✅ Set correct permissions for logs directory
RUN mkdir -p /app/logs && \
    chmod -R 777 /app/logs

# Copy start script
COPY --chown=nextjs:nodejs ./start.sh ./start.sh
RUN chmod +x ./start.sh

USER nextjs

EXPOSE 3001
ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Start both Express API and Next.js server
CMD ["./start.sh"]