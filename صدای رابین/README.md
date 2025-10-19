# 🎤 صدای رابین - Rabin Voice Assistant

دستیار هوشمند صوتی برای سیستم CRM

## 🚀 راه‌اندازی سریع

### مرحله 1: تنظیم Environment Variables

```bash
# اجرای اسکریپت setup
bash setup-env.sh

# یا دستی:
cp .env.example .env
nano .env
```

### مرحله 2: تنظیم API Keys

فایل `.env` را باز کنید و این مقادیر را تنظیم کنید:

```env
# 🔐 الزامی: OpenRouter API Key
OPENROUTER_API_KEY=sk-or-v1-YOUR-API-KEY-HERE
RABIN_VOICE_OPENROUTER_API_KEY=sk-or-v1-YOUR-API-KEY-HERE

# 🤖 اختیاری: مدل هوش مصنوعی (پیش‌فرض: claude-3-haiku)
OPENROUTER_MODEL=anthropic/claude-3-haiku

# 🔊 اختیاری: TTS API
TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
```

### مرحله 3: دریافت OpenRouter API Key

1. برو به: https://openrouter.ai/
2. ثبت‌نام کن یا لاگین کن
3. به بخش "Keys" برو
4. یک API Key جدید بساز
5. کپی کن و در `.env` قرار بده

### مرحله 4: اجرا

#### Development (محلی)
```bash
npm install
npm run dev
```

#### Production (Docker)
```bash
# از ریشه پروژه
docker-compose up rabin-voice
```

## 📋 متغیرهای محیطی

### الزامی

| متغیر | توضیح | مثال |
|-------|-------|------|
| `OPENROUTER_API_KEY` | کلید API هوش مصنوعی | `sk-or-v1-...` |

### اختیاری

| متغیر | پیش‌فرض | توضیح |
|-------|---------|-------|
| `OPENROUTER_MODEL` | `anthropic/claude-3-haiku` | مدل هوش مصنوعی |
| `TTS_API_URL` | `https://api.ahmadreza-avandi.ir/text-to-speech` | API پخش صدا |
| `DATABASE_HOST` | `mysql` | آدرس دیتابیس |
| `DATABASE_USER` | `crm_app_user` | یوزر دیتابیس |
| `DATABASE_PASSWORD` | `1234` | پسورد دیتابیس |
| `PORT` | `3001` | پورت سرویس |
| `LOG_LEVEL` | `INFO` | سطح لاگ |

## 🤖 مدل‌های پشتیبانی شده

### توصیه شده

- **Claude 3 Haiku** (پیش‌فرض): `anthropic/claude-3-haiku`
  - سریع و کارآمد
  - هزینه کم
  - کیفیت خوب

- **Claude 3.5 Sonnet**: `anthropic/claude-3.5-sonnet`
  - کیفیت بسیار بالا
  - درک عمیق‌تر
  - هزینه بیشتر

- **GPT-4 Turbo**: `openai/gpt-4-turbo`
  - کیفیت عالی
  - پشتیبانی گسترده

- **GPT-3.5 Turbo**: `openai/gpt-3.5-turbo`
  - سریع و ارزان
  - کیفیت متوسط

## 🔍 عیب‌یابی

### خطا: API Key not configured

```bash
# بررسی فایل .env
cat .env | grep OPENROUTER_API_KEY

# اگر خالی است یا "YOUR-API-KEY-HERE" است:
# 1. API Key واقعی از OpenRouter بگیرید
# 2. در .env قرار دهید
# 3. سرویس را restart کنید
```

### خطا: 401 Unauthorized

```bash
# API Key نامعتبر است
# 1. به OpenRouter.ai بروید
# 2. API Key جدید بسازید
# 3. در .env قرار دهید
```

### خطا: Cannot connect to database

```bash
# بررسی تنظیمات دیتابیس
cat .env | grep DATABASE

# برای development محلی:
DATABASE_HOST=localhost

# برای Docker:
DATABASE_HOST=mysql
```

## 📁 ساختار پروژه

```
صدای رابین/
├── .env.example          # Template فایل محیطی
├── .env                  # فایل محیطی (git ignore)
├── .gitignore           # فایل‌های ignore شده
├── setup-env.sh         # اسکریپت راه‌اندازی
├── README.md            # این فایل
├── app/
│   └── api/
│       ├── ai/          # API هوش مصنوعی
│       └── tts/         # API پخش صدا
├── lib/
│   ├── database.ts      # اتصال دیتابیس
│   └── keywordDetector.ts
└── api/
    ├── index.js         # Express server
    └── routes/
```

## 🔐 امنیت

### ⚠️ مهم

- **هرگز** فایل `.env` را commit نکنید
- **همیشه** از `.env.example` استفاده کنید
- **فقط** API Key های test را در مستندات قرار دهید
- **حتماً** `.gitignore` را چک کنید

### بررسی قبل از commit

```bash
# بررسی فایل‌های staged
git status

# اگر .env در لیست بود:
git reset .env

# اضافه کردن به .gitignore
echo ".env" >> .gitignore
```

## 📞 پشتیبانی

اگر مشکلی داشتید:

1. فایل `.env.example` را چک کنید
2. لاگ‌ها را بررسی کنید: `docker logs crm-rabin-voice`
3. مستندات OpenRouter را بخوانید: https://openrouter.ai/docs

## 📝 لایسنس

این پروژه توسط احمدرضا آوندی توسعه داده شده است.

---

**نسخه:** 1.0.0  
**آخرین بروزرسانی:** 2025-01-19
