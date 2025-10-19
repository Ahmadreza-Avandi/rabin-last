#!/bin/bash

# 🔧 اسکریپت رفع مشکل Rabin Voice
# این اسکریپت روی سرور اجرا می‌شود

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 رفع مشکل Rabin Voice - Express Module"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# مشکل: در Dockerfile صدای رابین، standalone build node_modules رو شامل نمی‌شه
# راه حل: باید node_modules از builder stage کپی بشه

echo "🔍 بررسی Dockerfile..."

# بررسی Dockerfile
if ! grep -q "COPY --from=deps" "صدای رابین/Dockerfile"; then
    echo "⚠️  Dockerfile مشکل دارد"
    echo "🔧 اصلاح Dockerfile..."
    
    # بک‌آپ
    cp "صدای رابین/Dockerfile" "صدای رابین/Dockerfile.backup.$(date +%s)"
    
    # ایجاد Dockerfile جدید
    cat > "صدای رابین/Dockerfile" << 'EOF'
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

# 🔧 کپی API directory
COPY --from=builder --chown=nextjs:nodejs /app/api ./api

# 🔧 کپی node_modules از deps stage (شامل express و بقیه dependencies)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Set correct permissions for logs and public directories
RUN mkdir -p /app/logs /app/public && \
    chown -R 777 /app/logs /app/public

# Copy start script
COPY --chown=nextjs:nodejs ./start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3001
ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Start both Express API and Next.js Server
CMD ["./start.sh"]
EOF
    
    echo "✅ Dockerfile اصلاح شد"
else
    echo "✅ Dockerfile درست است"
fi

# متوقف کردن rabin-voice
echo "🛑 متوقف کردن rabin-voice..."
docker-compose stop rabin-voice

# حذف کانتینر
echo "🗑️ حذف کانتینر rabin-voice..."
docker rm crm_rabin_voice 2>/dev/null || true

# حذف image
echo "🗑️ حذف image rabin-voice..."
docker rmi rabin-last-rabin-voice 2>/dev/null || true

# Build مجدد بدون cache
echo "🔨 Build مجدد rabin-voice (بدون cache)..."
docker-compose build --no-cache rabin-voice

# راه‌اندازی مجدد
echo "🚀 راه‌اندازی مجدد rabin-voice..."
docker-compose up -d rabin-voice

# انتظار برای آماده شدن
echo "⏳ انتظار برای آماده شدن (30 ثانیه)..."
sleep 30

# بررسی لاگ
echo "🔍 بررسی لاگ..."
docker logs crm_rabin_voice --tail 30

# تست
echo ""
echo "🧪 تست rabin-voice..."
if curl -f http://localhost:3001/ >/dev/null 2>&1; then
    echo "✅ rabin-voice در حال اجراست"
else
    echo "⚠️  rabin-voice هنوز مشکل دارد"
    echo "🔍 لاگ کامل:"
    docker logs crm_rabin_voice
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Rabin Voice فیکس شد!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 حالا nginx را ریستارت کنید:"
echo "   docker-compose restart nginx"
echo ""
