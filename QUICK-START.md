# ⚡ راهنمای سریع Deploy

## 🎯 قبل از Deploy (فقط 3 مرحله!)

### مرحله 1: تنظیم ENV ریشه پروژه
```bash
# کپی template
cp .env.unified .env

# ویرایش
nano .env

# تنظیم این موارد:
# - DATABASE_PASSWORD=1234        (تغییر بده!)
# - JWT_SECRET=...                (تغییر بده!)
# - NEXTAUTH_URL=https://...      (دامنه خودت)
```

### مرحله 2: تنظیم ENV صدای رابین
```bash
# رفتن به پوشه صدای رابین
cd "صدای رابین"

# اجرای setup
bash setup-env.sh

# ویرایش
nano .env

# تنظیم API Key (الزامی!):
# OPENROUTER_API_KEY=sk-or-v1-YOUR-KEY
# RABIN_VOICE_OPENROUTER_API_KEY=sk-or-v1-YOUR-KEY

# برگشت به ریشه
cd ..
```

**دریافت OpenRouter API Key:**
1. برو به: https://openrouter.ai/keys
2. Create New Key
3. کپی کن و در `صدای رابین/.env` بزار

### مرحله 3: بررسی و Deploy
```bash
# بررسی تنظیمات
bash check-env-before-deploy.sh

# اگر همه چیز OK بود:
bash deploy-server.sh
```

---

## 📁 فایل‌های مهم

```
پروژه/
├── .env                    ← تنظیم کن (CRM)
└── صدای رابین/
    └── .env                ← تنظیم کن (API Keys)
```

---

## ✅ چک‌لیست سریع

- [ ] `.env` در ریشه موجود است
- [ ] `DATABASE_PASSWORD` تنظیم شده
- [ ] `JWT_SECRET` تنظیم شده
- [ ] `صدای رابین/.env` موجود است
- [ ] `OPENROUTER_API_KEY` تنظیم شده (با sk-or-v1- شروع شود)
- [ ] اسکریپت بررسی اجرا شد: `bash check-env-before-deploy.sh`

---

## 🚀 Deploy

```bash
bash deploy-server.sh
```

---

## 🔍 اگر مشکل داشتی

```bash
# بررسی لاگ صدای رابین
docker logs crm-rabin-voice

# بررسی لاگ CRM
docker logs crm-nextjs

# Restart
docker-compose restart
```

---

## 📖 راهنمای کامل

برای جزئیات بیشتر:
- `DEPLOYMENT-ENV-SETUP.md` - راهنمای کامل
- `صدای رابین/README.md` - راهنمای صدای رابین

---

**موفق باشی! 🎉**
