# 📊 خلاصه یکپارچه‌سازی فایل‌های ENV

## 🎯 هدف
یکپارچه کردن تمام فایل‌های ENV پروژه برای استفاده آسان‌تر و مدیریت بهتر

## 📁 فایل‌های ایجاد شده

### 1. `.env.unified` ⭐
**فایل اصلی و مرجع** - شامل تمام تنظیمات برای:
- Next.js CRM
- SaaS Admin Panel  
- Rabin Voice Assistant
- Docker Deployment

### 2. `unify-env-files.sh` 🔧
**اسکریپت یکپارچه‌سازی** - این کارها را انجام می‌دهد:
- پشتیبان‌گیری از فایل‌های قدیمی
- ایجاد `.env` برای production
- ایجاد `.env.local` برای development
- ایجاد `.env.server` برای Docker

### 3. `ENV-UNIFICATION-GUIDE.md` 📖
**راهنمای کامل** - شامل:
- نحوه استفاده
- توضیح متغیرها
- عیب‌یابی
- مثال‌های کد

## 🚀 نحوه استفاده (3 مرحله ساده)

### مرحله 1: اجرای اسکریپت
```bash
# در Windows (Git Bash یا WSL)
bash unify-env-files.sh

# یا در Linux/Mac
chmod +x unify-env-files.sh
./unify-env-files.sh
```

### مرحله 2: بررسی فایل‌ها
```bash
# بررسی فایل‌های ایجاد شده
ls -la .env*

# باید این فایل‌ها را ببینید:
# .env          (production)
# .env.local    (development)
# .env.server   (Docker)
# .env.unified  (مرجع اصلی)
```

### مرحله 3: تست
```bash
# Development
npm run dev

# Production
npm run build
npm start

# Docker
docker-compose up --build
```

## 📋 متغیرهای کلیدی

### 🗄️ دیتابیس
```env
# Master (SaaS)
MASTER_DB_HOST=mysql
MASTER_DB_USER=root

# Tenant
DATABASE_HOST=mysql
DATABASE_USER=crm_app_user
DATABASE_PASSWORD=1234
DATABASE_NAME=crm_system
```

### 🎤 Rabin Voice
```env
RABIN_VOICE_OPENROUTER_API_KEY=sk-or-v1-...
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku
RABIN_VOICE_TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
```

### 📧 Email
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=ahmadrezaavandi@gmail.com
EMAIL_PASS=lqjp rnqy rnqy lqjp
```

### 🔐 Security
```env
JWT_SECRET=jwt_secret_key_production_2024_crm_system
NEXTAUTH_SECRET=crm_super_secret_key_production_2024
DB_ENCRYPTION_KEY=0329f3e3b5cd43ee84e81b2799f778c6d3b7d774f1a54950b9f7efc9ab2708ac
```

## ✅ مزایا

### قبل:
- ❌ 3 فایل ENV مختلف
- ❌ تنظیمات تکراری
- ❌ سخت برای مدیریت
- ❌ احتمال خطا بالا

### بعد:
- ✅ 1 فایل مرجع (`.env.unified`)
- ✅ تنظیمات یکپارچه
- ✅ آسان برای مدیریت
- ✅ احتمال خطا کم

## 🔍 استفاده در کد

### Next.js CRM
```typescript
const dbHost = process.env.DATABASE_HOST;
const dbUser = process.env.DATABASE_USER;
```

### SaaS Admin
```typescript
const masterHost = process.env.MASTER_DB_HOST || process.env.DATABASE_HOST;
const masterUser = process.env.MASTER_DB_USER || process.env.DATABASE_USER;
```

### Rabin Voice
```typescript
const apiKey = process.env.RABIN_VOICE_OPENROUTER_API_KEY;
const dbHost = process.env.DATABASE_HOST;
```

### Docker Compose
```yaml
services:
  nextjs:
    env_file: .env
  rabin-voice:
    env_file: .env
```

## 🎯 نتیجه

✨ **حالا تمام پروژه از یک فایل ENV یکپارچه استفاده می‌کند!**

- ✅ Next.js CRM
- ✅ SaaS Admin Panel
- ✅ Rabin Voice Assistant
- ✅ Docker Deployment
- ✅ deploy-server.sh

## 📞 پشتیبانی

اگر مشکلی داشتید:
1. فایل `ENV-UNIFICATION-GUIDE.md` را بخوانید
2. فایل‌های backup را چک کنید: `env_backup_*/`
3. اسکریپت را مجدداً اجرا کنید

---

**✨ موفق باشید!**
