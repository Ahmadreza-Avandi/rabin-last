# 🚀 راهنمای Deploy - فقط 3 مرحله!

## مرحله 1: تنظیم خودکار ENV ⚡

```bash
bash setup-all-env.sh
```

**این اسکریپت چه کاری انجام می‌دهد؟**
- ✅ خودکار `.env` در ریشه پروژه می‌سازد
- ✅ خودکار `.env.server` می‌سازد
- ✅ خودکار `صدای رابین/.env` می‌سازد
- ✅ تمام تنظیمات را با مقادیر صحیح پر می‌کند
- ✅ کلیدهای امنیتی تصادفی تولید می‌کند
- ✅ بررسی می‌کند که همه چیز درست ساخته شده

**تنظیمات خودکار:**
- 🌐 دامنه: `crm.robintejarat.com`
- 🔐 پسورد دیتابیس: `1234`
- 📧 Gmail: `ahmadrezaavandi@gmail.com`
- 🔑 Google OAuth: خودکار
- 🔐 DB Encryption Key: خودکار
- 🔊 TTS API: خودکار

---

## مرحله 2: تنظیم کلید OpenRouter 🔑

```bash
nano "صدای رابین/.env"
```

**فقط این 2 خط را ویرایش کنید:**

```env
OPENROUTER_API_KEY=sk-or-v1-YOUR-KEY-HERE
RABIN_VOICE_OPENROUTER_API_KEY=sk-or-v1-YOUR-KEY-HERE
```

**دریافت کلید:**
1. برو به: https://openrouter.ai/keys
2. Create New Key
3. کپی کن
4. جایگزین کن

**ذخیره و خروج:**
- `Ctrl+O` (ذخیره)
- `Enter` (تایید)
- `Ctrl+X` (خروج)

---

## مرحله 3: بررسی و Deploy 🚀

```bash
# بررسی
bash check-env-before-deploy.sh

# اگر همه چیز OK بود:
bash deploy-server.sh
```

---

## ✅ تمام!

بعد از Deploy، سایت شما آماده است:
- 🌐 CRM: https://crm.robintejarat.com
- 🎤 Rabin Voice: https://crm.robintejarat.com/rabin-voice

---

## 🔍 بررسی وضعیت

```bash
# وضعیت کانتینرها
docker ps

# لاگ صدای رابین
docker logs crm-rabin-voice

# لاگ CRM
docker logs crm-nextjs
```

---

## 🆘 اگر مشکلی پیش آمد

```bash
# Restart
docker-compose restart

# Rebuild
docker-compose down
docker-compose up --build -d
```

---

**همین! ساده است! 🎉**
