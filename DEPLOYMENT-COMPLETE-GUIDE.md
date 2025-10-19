# 🚀 راهنمای کامل Deployment CRM و Rabin Voice

## 📋 خلاصه مراحل

```bash
# مرحله 1: تنظیم تمام فایل‌های محیط
bash setup-all-env.sh

# مرحله 2: بررسی تمام تنظیمات
bash diagnose-deployment-issues.sh

# مرحله 3: Deploy کامل
bash deploy-server.sh
```

---

## 🎯 جزئیات هر مرحله

### مرحله 1️⃣: تنظیم محیط (Setup Environment)

```bash
bash setup-all-env.sh
```

**این اسکریپت انجام می‌دهد:**

✅ ایجاد `.env` فایل در ریشه پروژه  
✅ ایجاد `صدای رابین/.env`  
✅ تولید کلیدهای امنیتی تصادفی (JWT_SECRET, NEXTAUTH_SECRET)  
✅ کپی فایل‌های Database (`crm_system.sql`, `saas_master.sql`)  
✅ ایجاد دایرکتوری‌های لازم:
   - `uploads/{documents,avatars,chat,temp}`
   - `public/uploads/{documents,avatars,chat}`
   - `logs/`
   - `صدای رابین/logs/`
   - `database/`

✅ تنظیم Permissions  
✅ درخواست OpenRouter API Key (اختیاری)

**خروجی:** فایل‌های `.env` آماده برای Deploy

---

### مرحله 2️⃣: بررسی تنظیمات (Diagnostic Check)

```bash
bash diagnose-deployment-issues.sh
```

**این اسکریپت بررسی می‌کند:**

✅ وجود تمام فایل‌های `.env`  
✅ صحت Database Password و Username  
✅ وجود OpenRouter API Key  
✅ موجود بودن Database Files  
✅ صحت Docker Configuration  
✅ موجود بودن Deployment Scripts  

**نتیجه:**
- اگر ✅ **تمام چک‌ها pass شدند**: می‌تونید Deploy کنید
- اگر ❌ **خطایی وجود داشت**: نوشته می‌شود و راه‌حل پیشنهاد می‌شود

---

### مرحله 3️⃣: Deploy (استقرار سرور)

```bash
bash deploy-server.sh
```

**این اسکریپت انجام می‌دهد:**

🔍 **بررسی سیستم و تنظیم Swap**
- بررسی حافظه سیستم
- اگر کمتر از 2GB: تنظیم Swap خودکار

🔧 **حل مشکلات Build**
- حذف کاراکترهای مخفی
- تصحیح encoding
- پاکسازی cache‌های Node.js

📁 **آماده‌سازی فایل‌ها**
- ایجاد دایرکتوری‌های SSL و Database
- کپی Database Files

🐳 **تنظیم Docker**
- Build Docker Images
- شروع Docker Containers
- بررسی Health Checks

🔐 **تنظیم SSL/TLS**
- دریافت SSL Certificate از Let's Encrypt

🌐 **تنظیم Nginx**
- راه‌اندازی Reverse Proxy
- تنظیم Routing

📊 **بررسی نهایی**
- بررسی تمام Services
- بررسی Logs

---

## ⚠️ موارد مهم

### 1️⃣ OpenRouter API Key

Rabin Voice برای کار کردن **باید** OpenRouter API Key داشته باشد.

**دریافت کلید:**

1. برو به: https://openrouter.ai/
2. ثبت‌نام یا لاگین کنید
3. برو به: https://openrouter.ai/keys
4. کلیک کن: "Create New Key"
5. کپی کن (شبیه: `sk-or-v1-xxxxx...`)

**تنظیم کلید:**

**گزینه 1:** هنگام اجرای `setup-all-env.sh`
```bash
bash setup-all-env.sh
# جواب دهید: بله
# و کلید را وارد کنید
```

**گزینه 2:** بعداً (دستی)
```bash
nano "صدای رابین/.env"
```

سپس این خطوط را پیدا کنید و تنظیم کنید:
```
OPENROUTER_API_KEY=sk-or-v1-xxxxx...
RABIN_VOICE_OPENROUTER_API_KEY=sk-or-v1-xxxxx...
```

---

### 2️⃣ Database Password

پسورد پیش‌فرض: `1234`

اگر می‌خواهید تغییر دهید:
```bash
DB_PASSWORD="رمز_جدید" bash setup-all-env.sh
```

---

### 3️⃣ Domain Configuration

دامنه پیش‌فرض: `crm.robintejarat.com`

برای تغییر، ویرایش کنید:
- `.env`
- `deploy-server.sh` (خط 6)

---

## 🔍 Troubleshooting

### MySQL Connection Error

**مشکل:** Access denied برای `crm_app_user`

**راه‌حل:**
```bash
# بررسی کنید که .env موجود است
ls -la .env

# بررسی کنید DATABASE_PASSWORD تنظیم شده
grep DATABASE_PASSWORD .env

# اجرا کنید:
bash setup-all-env.sh
```

---

### Rabin Voice 502 Error

**مشکل:** nginx برگشت می‌دهد 502 Bad Gateway

**راه‌حل:**
```bash
# بررسی لاگ‌های Rabin Voice
docker logs -f rabin-voice

# بررسی کنید OpenRouter API Key تنظیم شده
grep OPENROUTER_API_KEY "صدای رابین/.env"

# اگر خالی بود، تنظیم کنید:
nano "صدای رابین/.env"
```

---

### Database Import Error

**مشکل:** Database files یافت نشد

**راه‌حل:**
```bash
# بررسی کنید فایل‌ها وجود دارند:
ls -la database/*.sql

# اگر نیستند، کپی کنید:
cp دیتابیس/*.sql database/
```

---

## 📊 بررسی Deployment

بعد از Deploy، بررسی کنید:

```bash
# بررسی Containers
docker ps

# بررسی Logs
docker logs -f mysql
docker logs -f nextjs-app
docker logs -f rabin-voice

# بررسی Services
curl https://crm.robintejarat.com
curl https://crm.robintejarat.com/rabin-voice/
```

---

## 🆘 کمک

اگر مشکلی داشتید:

1. **بررسی کنید:**
   ```bash
   bash diagnose-deployment-issues.sh
   ```

2. **بررسی لاگ‌ها:**
   ```bash
   docker logs -f mysql
   docker logs -f nextjs-app
   docker logs -f rabin-voice
   ```

3. **بررسی تنظیمات:**
   ```bash
   cat .env
   cat "صدای رابین/.env"
   ```

4. **اجرا کنید دوباره:**
   ```bash
   bash setup-all-env.sh
   bash diagnose-deployment-issues.sh
   bash deploy-server.sh
   ```

---

## ✨ خلاصه

| مرحله | دستور | مدت زمان | توضیح |
|------|-------|---------|-------|
| 1 | `bash setup-all-env.sh` | ۱ دقیقه | تنظیم فایل‌های محیط |
| 2 | `bash diagnose-deployment-issues.sh` | ۱۰ ثانیه | بررسی تنظیمات |
| 3 | `bash deploy-server.sh` | ۵-۱۰ دقیقه | Deploy Docker |

**کل زمان:** حدود ۱۵ دقیقه

---

## 📞 نکات مهم

- ✅ همیشه `setup-all-env.sh` را اول اجرا کنید
- ✅ بررسی کنید `diagnose-deployment-issues.sh` همه چک‌ها pass می‌شود
- ✅ OpenRouter API Key را تنظیم کنید (اگر می‌خواهید Rabin Voice کار کند)
- ✅ Database files را کپی کنید
- ✅ بررسی کنید Docker و Docker Compose نصب شده‌اند

---

**موفق باشید! 🚀**