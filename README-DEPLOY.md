# 🚀 راهنمای دیپلوی پروژه CRM

## 📋 مراحل دیپلوی

### 1️⃣ روی لوکال (ویندوز)

قبل از آپلود به سرور، همه مشکلات را فیکس کنید:

```bash
npm run fix-before-deploy
```

این اسکریپت موارد زیر را اصلاح می‌کند:
- ✅ nginx/default.conf (DNS resolver و location)
- ✅ صدای رابین/.env (OpenRouter API Key)
- ✅ docker-compose.yml (MySQL root password)
- ✅ صدای رابین/Dockerfile (node_modules)
- ✅ صدای رابین/start.sh (مسیر server.js)
- ✅ database/init.sql (DROP USER و پسورد)
- ✅ یکسان‌سازی پسوردها

### 2️⃣ آپلود به سرور

فایل‌ها را به سرور آپلود کنید (با git، scp، ftp و غیره)

### 3️⃣ روی سرور

```bash
# تنظیم ENV ها
bash setup-all-env.sh

# دیپلوی
bash deploy-server.sh
```

## 🔧 دستورات مفید

### روی لوکال
```bash
npm run fix-before-deploy    # فیکس مشکلات قبل از دیپلوی
```

### روی سرور
```bash
bash setup-all-env.sh         # تنظیم ENV ها
bash deploy-server.sh         # دیپلوی معمولی
bash deploy-server.sh --clean # دیپلوی با پاکسازی کامل
```

## 📊 فایل‌های مهم

- `fix-before-deploy.js` - اسکریپت فیکس مشکلات (روی لوکال)
- `setup-all-env.sh` - تنظیم ENV ها (روی سرور)
- `deploy-server.sh` - دیپلوی اصلی (روی سرور)
- `DEPLOY-READY.md` - خلاصه تغییرات (تولید خودکار)

## ⚠️ نکات مهم

1. حتماً قبل از آپلود `npm run fix-before-deploy` را اجرا کنید
2. OpenRouter API Key در `صدای رابین/.env` تنظیم می‌شود
3. پسوردها در همه فایل‌ها یکسان‌سازی می‌شوند
4. فایل `DEPLOY-READY.md` خلاصه تغییرات را نشان می‌دهد
