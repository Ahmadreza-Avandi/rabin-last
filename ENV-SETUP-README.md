# 🔧 راهنمای تنظیم Environment Variables

## 📋 فایل‌های مورد نیاز

قبل از اجرای پروژه، باید این فایل‌ها را ایجاد کنید:

### 1. `.env` (ریشه پروژه)
```bash
cp .env.example .env
nano .env
```

### 2. `صدای رابین/.env`
```bash
cp "صدای رابین/.env.example" "صدای رابین/.env"
nano "صدای رابین/.env"
```

## 🚀 راه سریع: استفاده از اسکریپت خودکار

```bash
# تنظیم خودکار همه ENV ها
bash setup-all-env.sh

# فقط کلید OpenRouter را تنظیم کنید
nano "صدای رابین/.env"
```

## 🔑 متغیرهای مهم که باید تنظیم کنید

### الزامی:
- `DATABASE_PASSWORD` - پسورد دیتابیس
- `JWT_SECRET` - کلید امنیتی JWT
- `NEXTAUTH_SECRET` - کلید NextAuth
- `OPENROUTER_API_KEY` - کلید هوش مصنوعی (در صدای رابین/.env)

### اختیاری:
- `GOOGLE_CLIENT_ID` - برای Google OAuth
- `GOOGLE_CLIENT_SECRET` - برای Google OAuth
- `GOOGLE_REFRESH_TOKEN` - برای Google OAuth
- `EMAIL_USER` - برای ارسال ایمیل
- `EMAIL_PASS` - App Password Gmail

## 🔐 امنیت

⚠️ **هرگز این فایل‌ها را commit نکنید:**
- `.env`
- `.env.server`
- `.env.local`
- `صدای رابین/.env`

✅ **فقط این فایل‌ها را commit کنید:**
- `.env.example`
- `.env.unified`
- `صدای رابین/.env.example`

## 📖 راهنمای کامل

برای جزئیات بیشتر:
- `README-DEPLOY.md` - راهنمای Deploy
- `DEPLOY-GUIDE.md` - راهنمای کامل
- `START-HERE.md` - شروع سریع

## 🆘 پشتیبانی

اگر مشکلی داشتید:
1. فایل `.env.example` را بررسی کنید
2. اسکریپت `check-env-before-deploy.sh` را اجرا کنید
3. مستندات را مطالعه کنید
