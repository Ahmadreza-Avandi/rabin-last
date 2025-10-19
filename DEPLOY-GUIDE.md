# 🚀 راهنمای کامل Deploy روی سرور

## 📋 خلاصه: فقط 4 دستور!

```bash
# 1. تنظیم خودکار ENV
bash setup-production-env.sh

# 2. تنظیم کلید OpenRouter
bash set-openrouter-key.sh

# 3. بررسی تنظیمات
bash check-env-before-deploy.sh

# 4. Deploy
bash deploy-server.sh
```

---

## 📖 توضیح کامل

### مرحله 1: تنظیم خودکار ENV

```bash
bash setup-production-env.sh
```

**این اسکریپت چه کاری انجام می‌دهد؟**

✅ از شما می‌پرسد:
- دامنه سایت (مثلاً: crm.robintejarat.com)
- پسورد دیتابیس (پیش‌فرض: 1234)
- ایمیل Gmail (اختیاری)
- App Password Gmail (اختیاری)

✅ خودکار انجام می‌دهد:
- تولید کلیدهای امنیتی تصادفی (JWT_SECRET, NEXTAUTH_SECRET)
- ایجاد فایل `.env` در ریشه پروژه
- ایجاد فایل `.env.server` در ریشه پروژه
- ایجاد فایل `صدای رابین/.env`
- ایجاد اسکریپت کمکی `set-openrouter-key.sh`

✅ تنظیمات ثابت که خودکار اضافه می‌شود:
- Google OAuth (Client ID, Secret, Refresh Token)
- DB Encryption Key
- TTS API URL
- تمام تنظیمات پیش‌فرض

**خروجی:**
```
✅ .env (ریشه پروژه)
✅ .env.server (ریشه پروژه)
✅ صدای رابین/.env
✅ set-openrouter-key.sh
```

---

### مرحله 2: تنظیم کلید OpenRouter

```bash
bash set-openrouter-key.sh
```

**این اسکریپت چه کاری انجام می‌دهد؟**

✅ از شما می‌پرسد:
- OpenRouter API Key (باید با `sk-or-v1-` شروع شود)

✅ خودکار انجام می‌دهد:
- بررسی فرمت کلید
- تنظیم کلید در `صدای رابین/.env`
- تنظیم کلید در `.env` (برای fallback)

**دریافت کلید:**
1. برو به: https://openrouter.ai/keys
2. ثبت‌نام کن یا لاگین کن
3. Create New Key
4. کپی کن (شبیه: `sk-or-v1-b0a0b4bd4fa00faf...`)
5. در اسکریپت وارد کن

---

### مرحله 3: بررسی تنظیمات

```bash
bash check-env-before-deploy.sh
```

**این اسکریپت چه کاری انجام می‌دهد؟**

✅ بررسی می‌کند:
- فایل `.env` در ریشه موجود است؟
- فایل `صدای رابین/.env` موجود است؟
- OpenRouter API Key تنظیم شده؟
- Database Password تنظیم شده؟
- JWT_SECRET تنظیم شده؟
- NEXTAUTH_SECRET تنظیم شده؟
- Docker نصب است؟
- docker-compose نصب است؟
- تمام فایل‌های مورد نیاز موجود است؟

**خروجی:**
```
✅ همه چیز آماده است! می‌توانید deploy کنید
```

یا

```
❌ X خطا و Y هشدار یافت شد
```

---

### مرحله 4: Deploy

```bash
bash deploy-server.sh
```

**این اسکریپت چه کاری انجام می‌دهد؟**

✅ مراحل Deploy:
1. بررسی سیستم و حافظه
2. حل مشکلات Build و encoding
3. آماده‌سازی فایل‌ها و دایرکتری‌ها
4. تنظیم SSL (Let's Encrypt)
5. تنظیم nginx
6. Build و راه‌اندازی Docker containers:
   - MySQL
   - phpMyAdmin
   - Next.js CRM
   - Rabin Voice
   - nginx
7. بررسی وضعیت سرویس‌ها
8. نمایش گزارش نهایی

**زمان تقریبی:** 10-20 دقیقه (بسته به سرعت اینترنت و سرور)

---

## 📁 ساختار فایل‌های ENV

### بعد از اجرای اسکریپت‌ها:

```
پروژه/
├── .env                          ✅ تنظیمات CRM و عمومی
├── .env.server                   ✅ کپی از .env برای Docker
├── .env.unified                  📋 Template (مرجع)
│
├── setup-production-env.sh       🔧 اسکریپت تنظیم خودکار
├── set-openrouter-key.sh         🔑 اسکریپت تنظیم API Key
├── check-env-before-deploy.sh    🔍 اسکریپت بررسی
├── deploy-server.sh              🚀 اسکریپت Deploy
│
└── صدای رابین/
    ├── .env                      ✅ تنظیمات صدای رابین + API Key
    ├── .env.example              📋 Template
    └── .gitignore                🔒 .env رو ignore می‌کنه
```

---

## 🔍 بررسی بعد از Deploy

### 1. بررسی وضعیت کانتینرها

```bash
docker ps
```

باید این کانتینرها را ببینید:
- ✅ crm-mysql
- ✅ crm-phpmyadmin
- ✅ crm-nextjs
- ✅ crm-rabin-voice
- ✅ crm-nginx

### 2. بررسی لاگ‌ها

```bash
# لاگ صدای رابین
docker logs crm-rabin-voice

# باید ببینید:
# ✅ OpenRouter API Key: Set ✓
# ✅ TTS_API_URL: https://api.ahmadreza-avandi.ir/text-to-speech

# لاگ CRM
docker logs crm-nextjs

# لاگ nginx
docker logs crm-nginx
```

### 3. تست سایت

```bash
# باز کردن در مرورگر:
https://crm.robintejarat.com
https://crm.robintejarat.com/rabin-voice
```

---

## 🔧 عیب‌یابی

### مشکل 1: OpenRouter API Key کار نمی‌کند

```bash
# بررسی کلید
cat "صدای رابین/.env" | grep OPENROUTER_API_KEY

# اگر YOUR_OPENROUTER_API_KEY_HERE بود:
bash set-openrouter-key.sh

# Restart
docker-compose restart rabin-voice
```

### مشکل 2: دیتابیس متصل نمی‌شود

```bash
# بررسی پسورد
cat .env | grep DATABASE_PASSWORD

# بررسی لاگ MySQL
docker logs crm-mysql

# Restart
docker-compose restart mysql
```

### مشکل 3: SSL کار نمی‌کند

```bash
# بررسی گواهی
sudo ls -la /etc/letsencrypt/live/crm.robintejarat.com/

# اگر وجود نداشت، دوباره deploy کنید
bash deploy-server.sh
```

---

## 🔄 به‌روزرسانی تنظیمات

### تغییر OpenRouter API Key

```bash
bash set-openrouter-key.sh
docker-compose restart rabin-voice
```

### تغییر پسورد دیتابیس

```bash
nano .env
# DATABASE_PASSWORD را تغییر دهید

nano "صدای رابین/.env"
# DATABASE_PASSWORD را تغییر دهید

docker-compose down
docker-compose up -d
```

### تغییر دامنه

```bash
nano .env
# NEXTAUTH_URL را تغییر دهید

docker-compose restart
```

---

## 📊 خلاصه دستورات

```bash
# تنظیم اولیه (یکبار)
bash setup-production-env.sh
bash set-openrouter-key.sh
bash check-env-before-deploy.sh
bash deploy-server.sh

# بررسی وضعیت
docker ps
docker logs crm-rabin-voice
docker logs crm-nextjs

# Restart
docker-compose restart
docker-compose restart rabin-voice

# Stop
docker-compose down

# Start
docker-compose up -d

# Rebuild
docker-compose up --build -d

# لاگ‌ها
docker logs -f crm-rabin-voice
docker logs -f crm-nextjs
```

---

## 🔐 نکات امنیتی

### قبل از Push به GitHub:

```bash
# بررسی .gitignore
cat .gitignore | grep ".env"

# بررسی فایل‌های staged
git status

# اگر .env در لیست بود:
git reset .env
git reset "صدای رابین/.env"
```

### فایل‌هایی که باید commit شوند:
- ✅ `.env.example`
- ✅ `.env.unified`
- ✅ `صدای رابین/.env.example`
- ✅ تمام اسکریپت‌ها (.sh)

### فایل‌هایی که نباید commit شوند:
- ❌ `.env`
- ❌ `.env.server`
- ❌ `صدای رابین/.env`

---

## 🎉 تمام!

حالا سیستم شما آماده است:
- ✅ CRM: https://crm.robintejarat.com
- ✅ Rabin Voice: https://crm.robintejarat.com/rabin-voice
- ✅ phpMyAdmin: https://crm.robintejarat.com/secure-db-admin-panel-x7k9m2/

**موفق باشید! 🚀**
