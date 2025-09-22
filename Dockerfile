# Stage 1: Base image
FROM node:18-alpine AS base

# Install minimal system dependencies
RUN apk add --no-cache \
    libc6-compat \
    curl \
    bash \
    file \
    sed

# Set locale and encoding
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

WORKDIR /app

# Create necessary directories
RUN mkdir -p /app/debug /app/scripts /app/logs

# مرحله 2: Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm install --only=production --prefer-offline --no-audit --progress=false

# مرحله 3: Builder
FROM base AS builder
COPY package*.json ./

# نصب dependencies با تنظیمات بهینه
RUN npm install --prefer-offline --no-audit --progress=false --maxsockets 1

# کپی کل پروژه
COPY . .

# حذف کاراکترهای مخفی و تبدیل encoding قبل از build
RUN find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do \
    if [ -f "$file" ]; then \
        # حذف کاراکترهای مخفی \
        sed -i 's/\xE2\x80\x8F//g; s/\xE2\x80\x8E//g; s/\xE2\x80\x8B//g; s/\xE2\x80\x8C//g; s/\xE2\x80\x8D//g; s/\xEF\xBB\xBF//g' "$file" 2>/dev/null || true; \
        # تبدیل CRLF به LF \
        sed -i 's/\r$//' "$file" 2>/dev/null || true; \
        # اطمینان از UTF-8 encoding \
        iconv -f UTF-8 -t UTF-8 "$file" -o "$file.tmp" 2>/dev/null && mv "$file.tmp" "$file" || rm -f "$file.tmp"; \
    fi; \
done

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