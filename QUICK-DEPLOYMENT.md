# ⚡ Quick Deployment Guide

## 🚀 3 مرحله برای Deploy کردن

### 1️⃣ تنظیم محیط
```bash
bash setup-all-env.sh
```
↳ تمام `.env` فایل‌ها، دایرکتوری‌ها و تنظیمات را خودکار ایجاد می‌کند

### 2️⃣ بررسی تنظیمات  
```bash
bash diagnose-deployment-issues.sh
```
↳ تمام چک‌ها pass شدند؟ ✅ بروید سراغ مرحله 3

### 3️⃣ شروع Deploy
```bash
bash deploy-server.sh
```
↳ Server کامل راه‌اندازی می‌شود

---

## ⚠️ یاد داشته باشید

- اگر Deploy ناموفق بود، **OpenRouter API Key** را بررسی کنید
- دریافت از: https://openrouter.ai/keys  
- تنظیم در: `nano صدای رابین/.env`

---

## 🔍 اگر مشکلی داشت

```bash
# لاگ‌ها را ببینید
docker logs -f mysql
docker logs -f nextjs-app
docker logs -f rabin-voice

# دوباره تلاش کنید
bash diagnose-deployment-issues.sh
```

---

## 📚 توضیح کامل

برای توضیح جزئیات: `DEPLOYMENT-COMPLETE-GUIDE.md`