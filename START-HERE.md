# 🚀 شروع کنید از اینجا!

## فقط 4 دستور تا Deploy کامل! ⚡

```bash
# 1️⃣  تنظیم خودکار ENV (2 دقیقه)
bash setup-production-env.sh

# 2️⃣  تنظیم کلید OpenRouter (1 دقیقه)
bash set-openrouter-key.sh

# 3️⃣  بررسی تنظیمات (30 ثانیه)
bash check-env-before-deploy.sh

# 4️⃣  Deploy! (10-20 دقیقه)
bash deploy-server.sh
```

---

## 📝 توضیح سریع

### دستور 1: `setup-production-env.sh`
**چی می‌کنه؟**
- از شما می‌پرسه: دامنه، پسورد دیتابیس، ایمیل
- خودکار همه ENV ها رو می‌سازه
- کلیدهای امنیتی تصادفی تولید می‌کنه

**چی می‌سازه؟**
- ✅ `.env` (ریشه پروژه)
- ✅ `.env.server` (ریشه پروژه)
- ✅ `صدای رابین/.env`

### دستور 2: `set-openrouter-key.sh`
**چی می‌کنه؟**
- از شما می‌پرسه: OpenRouter API Key
- کلید رو تو همه جا تنظیم می‌کنه

**کلید رو از کجا بگیری؟**
1. برو: https://openrouter.ai/keys
2. Create New Key
3. کپی کن

### دستور 3: `check-env-before-deploy.sh`
**چی می‌کنه؟**
- چک می‌کنه همه چی آماده باشه
- اگه مشکلی بود بهت می‌گه

### دستور 4: `deploy-server.sh`
**چی می‌کنه؟**
- کل پروژه رو با Docker بالا میاره
- SSL تنظیم می‌کنه
- nginx راه‌اندازی می‌کنه

---

## ✅ بعد از Deploy

سایت شما آماده است:
- 🌐 CRM: https://crm.robintejarat.com
- 🎤 Rabin Voice: https://crm.robintejarat.com/rabin-voice

---

## 📖 راهنمای کامل

اگه جزئیات بیشتر می‌خوای:
- `DEPLOY-GUIDE.md` - راهنمای کامل Deploy
- `QUICK-START.md` - راهنمای سریع

---

**همین! ساده است! 🎉**
