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

# Build Next.js مع معالجة BASE_PATH و ASSET_PREFIX
RUN npm run build 2>&1 | tee /tmp/build.log || { echo "❌ Build failed"; cat /tmp/build.log; exit 1; }

# مرحله 4: Runner
FROM base AS runner
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create necessary directories
RUN mkdir -p /app/logs /app/public

# کپی package.json (مورد نیاز برای next start fallback)
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# کپی فایل‌های public
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# کپی .next directory (standalone یا عادی - fallback to regular build)
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# 🔧 کپی API directory
COPY --from=builder --chown=nextjs:nodejs /app/api ./api

# 🔧 کپی node_modules از deps stage (شامل express و بقیه dependencies)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# ✅ Set correct permissions for logs and public directories
RUN mkdir -p /app/logs /app/public && \
    chmod -R 777 /app/logs /app/public

# Copy start script
COPY --chown=nextjs:nodejs ./start.sh ./start.sh
RUN chmod +x ./start.sh

USER nextjs

EXPOSE 3001
ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Start both Express API and Next.js server
CMD ["./start.sh"]