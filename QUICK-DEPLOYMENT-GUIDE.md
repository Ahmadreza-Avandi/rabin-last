# 🚀 راهنمای سریع Deployment

## 📋 مراحل Deployment

### 1️⃣ تنظیم ENV (تا یکبار)

```bash
# اسکریپت خودکار تنظیم تمامی فایل‌های ENV
bash setup-all-env.sh
```

**این اسکریپت انجام می‌دهد:**
- ✅ `.env` را در ریشه پروژه ایجاد می‌کند
- ✅ `صدای رابین/.env` را ایجاد می‌کند
- ✅ پسورد دیتابیس: `1234`
- ✅ کلیدهای امنیتی تصادفی ایجاد می‌کند

### 2️⃣ تنظیم OpenRouter API Key (ضروری)

```bash
# ویرایش فایل صدای رابین/.env
nano "صدای رابین/.env"
```

**این خط را پیدا کنید:**
```
OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE
```

**کلید خود را جایگزین کنید:**
```
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxx
```

> 📌 **دریافت کلید:** https://openrouter.ai/keys

### 3️⃣ بررسی تنظیمات قبل از Deploy

```bash
bash check-env-before-deploy.sh
```

**این اسکریپت بررسی می‌کند:**
- ✅ `.env` فایل‌ها موجود هستند
- ✅ کلیدهای مهم تنظیم شده‌اند
- ✅ Docker نصب است
- ✅ فایل‌های مورد نیاز موجود‌اند

### 4️⃣ شروع Deployment

```bash
bash deploy-server.sh
```

**این اسکریپت انجام می‌دهد:**
- 🔨 Docker images بسازی
- 🗄️ MySQL دیتابیس شروع
- 🎤 Rabin Voice Assistant شروع
- 🌐 Next.js Application شروع
- 🔒 SSL Certificate (اختیاری)
- 📡 Nginx Reverse Proxy

---

## 🔧 مشکلات و حل‌ها

### ❌ MySQL: Access denied for user 'crm_app_user'

**علت:** پسورد دیتابیس اشتباه است

**حل:**
```bash
# بک‌آپ موجود .env
cp .env .env.backup

# دوباره تنظیم
bash setup-all-env.sh

# بررسی
cat .env | grep DATABASE_PASSWORD
```

### ❌ Rabin Voice: 500 Internal Server Error

**علت:** `OPENROUTER_API_KEY` تنظیم نشده

**حل:**
```bash
# کلید را دستی تنظیم کنید
nano "صدای رابین/.env"

# سپس restart کنید
docker-compose down
bash deploy-server.sh
```

### ❌ Docker Build فشل

**علت:** حافظه کم یا کاش مشکل‌دار

**حل:**
```bash
# پاکسازی کامل و rebuild
bash deploy-server.sh --clean
```

---

## 📊 بررسی وضعیت

### بررسی containerها

```bash
docker-compose ps
```

**خروجی باید اینطور باشد:**
```
CONTAINER ID        STATUS
crm-mysql          Up (healthy)
crm-rabin-voice    Up
crm-nextjs         Up
crm-nginx          Up
```

### لاگ‌ها

```bash
# تمامی لاگ‌ها
docker-compose logs -f

# فقط MySQL
docker-compose logs -f mysql

# فقط Rabin Voice
docker-compose logs -f rabin-voice

# فقط Next.js
docker-compose logs -f nextjs
```

### تست API

```bash
# API سلامتی دیتابیس
curl http://localhost:3000/api/health

# API سلامتی Rabin Voice
curl http://localhost:3001/api/health
```

---

## 🌐 دسترسی به سیستم

| سرویس | URL |
|-------|-----|
| **CRM Application** | http://localhost:3000 یا https://crm.robintejarat.com |
| **phpMyAdmin** | http://localhost:3000/secure-db-admin-panel-x7k9m2/ |
| **Rabin Voice** | http://localhost:3001 |

### اطلاعات ورود

- **Database User:** `crm_app_user`
- **Database Password:** `1234` (از `.env`)
- **Database Name:** `crm_system`

---

## 🔄 دوباره شروع سرویس‌ها

```bash
# متوقف کردن
docker-compose down

# شروع مجدد
docker-compose up -d

# یا استفاده از deploy script
bash deploy-server.sh
```

---

## 🧹 پاکسازی کامل (حذف تمام داده‌ها)

⚠️ **هشدار:** این عملیات تمام داده‌های MySQL را حذف می‌کند

```bash
# پاکسازی کامل
docker-compose down -v

# یا با اسکریپت deploy
bash deploy-server.sh --clean
```

---

## 📝 متغیرهای محیطی مهم

| متغیر | مقدار | توضیح |
|------|-------|--------|
| `DATABASE_PASSWORD` | `1234` | پسورد دیتابیس MySQL |
| `DATABASE_USER` | `crm_app_user` | نام کاربری دیتابیس |
| `OPENROUTER_API_KEY` | - | کلید OpenRouter API |
| `NODE_ENV` | `production` | محیط Node.js |

---

## 🆘 نیاز به کمک؟

1. بررسی لاگ‌ها: `docker-compose logs`
2. بررسی تنظیمات: `cat .env`
3. اجرای بررسی: `bash check-env-before-deploy.sh`

**موفق باشید! 🎉**