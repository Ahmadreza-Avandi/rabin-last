# 🔧 راهنمای یکپارچه‌سازی فایل‌های ENV

## 📊 وضعیت قبل از یکپارچه‌سازی

پروژه شما از **3 فایل ENV مختلف** استفاده می‌کرد:

### 1. `.env` (اصلی)
```
استفاده: Development
دیتابیس: localhost:3306
یوزر: root
پسورد: خالی
```

### 2. `.env.local` (محلی)
```
استفاده: Development محلی
دیتابیس: localhost:3306
یوزر: root
پسورد: خالی
```

### 3. `.env.server` (سرور)
```
استفاده: Production/Docker
دیتابیس: mysql:3306 (Docker)
یوزر: crm_app_user
پسورد: 1234
```

## 🎯 مشکلات قبلی

- ❌ هر ماژول از فایل ENV متفاوتی استفاده می‌کرد
- ❌ تنظیمات تکراری و نامنظم
- ❌ سخت بودن مدیریت و به‌روزرسانی
- ❌ احتمال خطا در تنظیمات

## ✅ راه‌حل: یکپارچه‌سازی

یک فایل `.env.unified` ایجاد شده که:

### ✨ ویژگی‌ها:
- ✅ تمام تنظیمات در یک فایل
- ✅ سازگار با همه ماژول‌ها
- ✅ مستندسازی کامل
- ✅ دسته‌بندی منظم

### 📦 ماژول‌های پشتیبانی شده:
1. **Next.js CRM** (اصلی)
2. **SaaS Admin Panel** (Master Database)
3. **Rabin Voice Assistant** (صدای رابین)
4. **Docker Deployment** (deploy-server.sh)

## 🚀 نحوه استفاده

### مرحله 1: اجرای اسکریپت یکپارچه‌سازی

```bash
chmod +x unify-env-files.sh
./unify-env-files.sh
```

این اسکریپت:
- ✅ پشتیبان از فایل‌های قدیمی می‌گیرد
- ✅ فایل‌های جدید را ایجاد می‌کند
- ✅ تنظیمات را یکپارچه می‌کند

### مرحله 2: بررسی فایل‌های ایجاد شده

بعد از اجرا، این فایل‌ها ایجاد می‌شوند:

#### `.env` (Production)
```bash
# برای production و Docker
NODE_ENV=production
DATABASE_HOST=mysql
DATABASE_USER=crm_app_user
DATABASE_PASSWORD=1234
```

#### `.env.local` (Development)
```bash
# برای development محلی
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=
```

#### `.env.server` (Deployment)
```bash
# کپی از .env برای Docker
# همان تنظیمات production
```

## 📋 متغیرهای مهم

### 🗄️ دیتابیس

```env
# Master Database (SaaS)
MASTER_DB_HOST=mysql
MASTER_DB_USER=root
MASTER_DB_PASSWORD=

# Tenant Databases
DATABASE_HOST=mysql
DATABASE_USER=crm_app_user
DATABASE_PASSWORD=1234
DATABASE_NAME=crm_system
```

### 🎤 Rabin Voice

```env
# OpenRouter AI
RABIN_VOICE_OPENROUTER_API_KEY=sk-or-v1-...
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku

# TTS Service
RABIN_VOICE_TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech

# Logging
RABIN_VOICE_LOG_LEVEL=INFO
```

### 📧 Email

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=ahmadrezaavandi@gmail.com
EMAIL_PASS=lqjp rnqy rnqy lqjp
```

### 🔐 Security

```env
JWT_SECRET=jwt_secret_key_production_2024_crm_system
NEXTAUTH_SECRET=crm_super_secret_key_production_2024
DB_ENCRYPTION_KEY=0329f3e3b5cd43ee84e81b2799f778c6d3b7d774f1a54950b9f7efc9ab2708ac
```

## 🔍 نحوه استفاده در کد

### Next.js CRM
```typescript
// lib/database.ts
const host = process.env.DATABASE_HOST || 'localhost';
const user = process.env.DATABASE_USER || 'root';
```

### SaaS Admin Panel
```typescript
// lib/master-database.ts
const host = process.env.MASTER_DB_HOST || process.env.DATABASE_HOST;
const user = process.env.MASTER_DB_USER || process.env.DATABASE_USER;
```

### Rabin Voice
```typescript
// صدای رابین/lib/database.ts
const host = process.env.DATABASE_HOST || 'mysql';
const user = process.env.DATABASE_USER || 'crm_app_user';

// صدای رابین/app/api/ai/route.ts
const apiKey = process.env.RABIN_VOICE_OPENROUTER_API_KEY;
const model = process.env.RABIN_VOICE_OPENROUTER_MODEL;
```

### Docker Compose
```yaml
services:
  nextjs:
    env_file:
      - .env
    environment:
      - DATABASE_HOST=${DATABASE_HOST}
      - DATABASE_USER=${DATABASE_USER}
  
  rabin-voice:
    env_file:
      - .env
    environment:
      - RABIN_VOICE_OPENROUTER_API_KEY=${RABIN_VOICE_OPENROUTER_API_KEY}
```

## 🧪 تست

### 1. تست Development محلی
```bash
# استفاده از .env.local
NODE_ENV=development npm run dev
```

### 2. تست Production
```bash
# استفاده از .env
NODE_ENV=production npm run build
npm start
```

### 3. تست Docker
```bash
# استفاده از .env.server
docker-compose up --build
```

## 📝 نکات مهم

### ✅ انجام دهید:
- همیشه از `.env.local` برای development استفاده کنید
- قبل از deploy، `.env` را بررسی کنید
- رمزهای عبور را در production تغییر دهید
- فایل‌های `.env` را در `.gitignore` قرار دهید

### ❌ انجام ندهید:
- فایل‌های `.env` را commit نکنید
- رمزهای واقعی را در repository قرار ندهید
- بدون backup تغییرات ندهید

## 🔄 به‌روزرسانی

اگر نیاز به تغییر تنظیمات دارید:

### 1. ویرایش `.env.unified`
```bash
nano .env.unified
```

### 2. اجرای مجدد اسکریپت
```bash
./unify-env-files.sh
```

### 3. Restart سرویس‌ها
```bash
# Development
npm run dev

# Production
docker-compose restart
```

## 🆘 عیب‌یابی

### مشکل: متغیر محیطی خوانده نمی‌شود

**راه‌حل:**
```bash
# بررسی فایل .env
cat .env | grep VARIABLE_NAME

# بارگذاری مجدد
source .env

# Restart سرویس
npm run dev
```

### مشکل: Docker متغیرها را نمی‌بیند

**راه‌حل:**
```bash
# بررسی docker-compose
docker-compose config

# Rebuild
docker-compose down
docker-compose up --build
```

### مشکل: Rabin Voice به دیتابیس متصل نمی‌شود

**راه‌حل:**
```bash
# بررسی متغیرهای دیتابیس
echo $DATABASE_HOST
echo $DATABASE_USER

# بررسی لاگ
docker logs crm-rabin-voice
```

## 📊 مقایسه قبل و بعد

### قبل:
```
❌ 3 فایل ENV مختلف
❌ تنظیمات پراکنده
❌ سخت برای مدیریت
❌ احتمال خطا بالا
```

### بعد:
```
✅ 1 فایل ENV یکپارچه
✅ تنظیمات متمرکز
✅ آسان برای مدیریت
✅ احتمال خطا کم
```

## 🎉 نتیجه

حالا تمام پروژه از یک سیستم ENV یکپارچه استفاده می‌کند:

- ✅ **Next.js CRM**: از `.env` یا `.env.local`
- ✅ **SaaS Admin**: از همان `.env`
- ✅ **Rabin Voice**: از همان `.env`
- ✅ **Docker**: از `.env.server` (کپی از `.env`)

## 📞 پشتیبانی

اگر مشکلی داشتید:
1. فایل‌های backup را چک کنید: `env_backup_*/`
2. اسکریپت را مجدداً اجرا کنید
3. لاگ‌ها را بررسی کنید

---

**نسخه:** 1.0.0  
**تاریخ:** 2025-01-19  
**وضعیت:** ✅ آماده استفاده
