# 🤖 راهنمای تنظیم API هوش مصنوعی (OpenRouter) برای صدای رابین

## 🔍 بررسی کد

صدای رابین از **OpenRouter API** برای هوش مصنوعی استفاده می‌کنه و از **2 متغیر ENV** پشتیبانی می‌کنه:

### 1️⃣ در Next.js Route (`صدای رابین/app/api/ai/route.ts`)
```typescript
const AI_CONFIG = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || 'sk-or-v1-example-key-replace-with-real-key',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku'
};
```

### 2️⃣ در Express API (`صدای رابین/api/index.js`)
```javascript
const getAPIKey = () => {
  return process.env.RABIN_VOICE_OPENROUTER_API_KEY || 
         process.env.OPENROUTER_API_KEY || 
         null;
};

const ENV_CONFIG = {
  OPENROUTER_API_KEY: getAPIKey(),
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 
                    process.env.RABIN_VOICE_OPENROUTER_MODEL || 
                    'anthropic/claude-3-haiku'
};
```

## 📋 اولویت استفاده از متغیرها

صدای رابین به ترتیب این متغیرها رو چک می‌کنه:

### برای API Key:
1. **`RABIN_VOICE_OPENROUTER_API_KEY`** (اولویت اول - Express)
2. **`OPENROUTER_API_KEY`** (اولویت دوم - Next.js و Express)
3. **مقدار پیش‌فرض**: `null` (خطا می‌ده)

### برای Model:
1. **`RABIN_VOICE_OPENROUTER_MODEL`** (اولویت اول - Express)
2. **`OPENROUTER_MODEL`** (اولویت دوم - Next.js و Express)
3. **مقدار پیش‌فرض**: `anthropic/claude-3-haiku`

## ✅ راه‌حل: استفاده از هر دو متغیر

برای اطمینان، **هر دو متغیر** رو در فایل `.env` تنظیم کن:

### در `.env.unified` (قبلاً اضافه شده ✅)
```env
# ===========================================
# 🎤 Rabin Voice Assistant Configuration
# ===========================================

# OpenRouter AI Configuration
RABIN_VOICE_OPENROUTER_API_KEY=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
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku

# Alternative names for compatibility
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

## 🎯 کلید API رو کجا بذاری؟

### گزینه 1: استفاده از فایل یکپارچه (توصیه می‌شه ✅)

فایل `.env.unified` که من ساختم **قبلاً این تنظیمات رو داره**:

```env
# خط 68-72
RABIN_VOICE_OPENROUTER_API_KEY=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
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku

# خط 75-77 (برای سازگاری)
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

فقط کافیه اسکریپت یکپارچه‌سازی رو اجرا کنی:
```bash
bash unify-env-files.sh
```

### گزینه 2: اضافه کردن دستی

اگر می‌خوای دستی اضافه کنی، این خطوط رو به فایل‌های زیر اضافه کن:

#### `.env` (Production)
```env
# OpenRouter AI Configuration
RABIN_VOICE_OPENROUTER_API_KEY=sk-or-v1-YOUR-API-KEY-HERE
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku
OPENROUTER_API_KEY=sk-or-v1-YOUR-API-KEY-HERE
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

#### `.env.local` (Development)
```env
# OpenRouter AI Configuration
RABIN_VOICE_OPENROUTER_API_KEY=sk-or-v1-YOUR-API-KEY-HERE
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku
OPENROUTER_API_KEY=sk-or-v1-YOUR-API-KEY-HERE
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

#### `.env.server` (Docker)
```env
# OpenRouter AI Configuration
RABIN_VOICE_OPENROUTER_API_KEY=sk-or-v1-YOUR-API-KEY-HERE
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku
OPENROUTER_API_KEY=sk-or-v1-YOUR-API-KEY-HERE
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

## 🔑 دریافت API Key از OpenRouter

### مرحله 1: ثبت‌نام در OpenRouter
1. برو به: https://openrouter.ai/
2. ثبت‌نام کن یا لاگین کن
3. به بخش API Keys برو

### مرحله 2: ایجاد API Key
1. روی "Create New Key" کلیک کن
2. یک نام برای key انتخاب کن (مثلاً: "Rabin Voice")
3. Key رو کپی کن (شبیه: `sk-or-v1-...`)

### مرحله 3: اضافه کردن به ENV
```env
RABIN_VOICE_OPENROUTER_API_KEY=sk-or-v1-YOUR-COPIED-KEY-HERE
OPENROUTER_API_KEY=sk-or-v1-YOUR-COPIED-KEY-HERE
```

## 🤖 مدل‌های پشتیبانی شده

OpenRouter از مدل‌های مختلفی پشتیبانی می‌کنه:

### مدل‌های توصیه شده:

#### 1. Claude 3 Haiku (پیش‌فرض) ⭐
```env
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku
```
- ✅ سریع و کارآمد
- ✅ هزینه کم
- ✅ کیفیت خوب برای مکالمه
- 💰 قیمت: $0.25 / 1M tokens

#### 2. Claude 3.5 Sonnet (قدرتمند)
```env
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```
- ✅ کیفیت بسیار بالا
- ✅ درک عمیق‌تر
- ⚠️ هزینه بیشتر
- 💰 قیمت: $3 / 1M tokens

#### 3. GPT-4 Turbo
```env
RABIN_VOICE_OPENROUTER_MODEL=openai/gpt-4-turbo
```
- ✅ کیفیت عالی
- ✅ پشتیبانی گسترده
- ⚠️ هزینه بالا
- 💰 قیمت: $10 / 1M tokens

#### 4. GPT-3.5 Turbo (ارزان)
```env
RABIN_VOICE_OPENROUTER_MODEL=openai/gpt-3.5-turbo
```
- ✅ سریع
- ✅ هزینه کم
- ⚠️ کیفیت متوسط
- 💰 قیمت: $0.50 / 1M tokens

## 🔧 تنظیمات Docker

در `docker-compose.yml` این متغیرها قبلاً تنظیم شدن:

```yaml
rabin-voice:
  env_file:
    - .env
    - .env.server
  environment:
    - RABIN_VOICE_OPENROUTER_API_KEY=${RABIN_VOICE_OPENROUTER_API_KEY}
    - RABIN_VOICE_OPENROUTER_MODEL=${RABIN_VOICE_OPENROUTER_MODEL:-anthropic/claude-3-haiku}
```

## 🧪 تست تنظیمات

### 1. بررسی متغیر در Development
```bash
# در terminal
echo $OPENROUTER_API_KEY
echo $RABIN_VOICE_OPENROUTER_API_KEY
echo $OPENROUTER_MODEL
```

### 2. بررسی در Docker
```bash
# بررسی متغیرهای کانتینر
docker exec crm-rabin-voice env | grep OPENROUTER

# باید این خروجی رو ببینی:
# OPENROUTER_API_KEY=sk-or-v1-...
# RABIN_VOICE_OPENROUTER_API_KEY=sk-or-v1-...
# OPENROUTER_MODEL=anthropic/claude-3-haiku
# RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku
```

### 3. بررسی لاگ
```bash
# لاگ صدای رابین
docker logs crm-rabin-voice | grep -i openrouter

# باید این خطوط رو ببینی:
# 🔑 OpenRouter API Key: Set ✓
# 🤖 OpenRouter Model: anthropic/claude-3-haiku
```

### 4. تست عملکرد
```bash
# باز کردن صفحه صدای رابین
# http://localhost:3001/rabin-voice (development)
# https://crm.robintejarat.com/rabin-voice (production)

# تست AI:
# 1. سوالی بپرس (مثلاً: "سلام رابین")
# 2. باید پاسخ هوشمندانه بگیری
# 3. اگر خطا داد، لاگ رو چک کن
```

## 🔍 عیب‌یابی

### مشکل: AI پاسخ نمی‌ده

**راه‌حل 1: بررسی API Key**
```bash
# در کانتینر
docker exec crm-rabin-voice env | grep OPENROUTER_API_KEY

# اگر خالی بود یا "example-key" بود:
# 1. API Key واقعی رو از OpenRouter بگیر
# 2. در .env قرار بده
# 3. Docker رو rebuild کن
docker-compose down
docker-compose up --build
```

**راه‌حل 2: بررسی لاگ**
```bash
# لاگ کامل
docker logs crm-rabin-voice -f

# دنبال این خطاها بگرد:
# ❌ OpenRouter API error: 401 - Invalid API key
# ❌ OpenRouter API error: 429 - Rate limit exceeded
# ❌ Missing ✗ (یعنی API Key تنظیم نشده)
```

**راه‌حل 3: تست API مستقیم**
```bash
# تست با curl
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer YOUR-API-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-3-haiku",
    "messages": [
      {"role": "user", "content": "سلام"}
    ]
  }'

# باید پاسخ JSON با content بگیری
```

### مشکل: خطای 401 Unauthorized

**علت:** API Key نامعتبر یا منقضی شده

**راه‌حل:**
1. به OpenRouter برو: https://openrouter.ai/keys
2. API Key جدید بساز
3. در `.env` قرار بده
4. سرویس رو restart کن

### مشکل: خطای 429 Rate Limit

**علت:** تعداد درخواست‌ها زیاد بوده

**راه‌حل:**
1. صبر کن چند دقیقه
2. اعتبار حساب OpenRouter رو چک کن
3. اگر لازمه، اعتبار اضافه کن

### مشکل: خطای 500 Model Not Found

**علت:** نام مدل اشتباه است

**راه‌حل:**
```env
# مدل‌های صحیح:
OPENROUTER_MODEL=anthropic/claude-3-haiku
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_MODEL=openai/gpt-4-turbo
OPENROUTER_MODEL=openai/gpt-3.5-turbo
```

## 📊 خلاصه

### ✅ متغیرهای مورد نیاز:
```env
# API Key (الزامی)
RABIN_VOICE_OPENROUTER_API_KEY=sk-or-v1-YOUR-KEY
OPENROUTER_API_KEY=sk-or-v1-YOUR-KEY

# Model (اختیاری - پیش‌فرض: claude-3-haiku)
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

### ✅ فایل‌های مورد نیاز:
- `.env` (production)
- `.env.local` (development)
- `.env.server` (Docker)

### ✅ مکان‌های استفاده:
- `صدای رابین/app/api/ai/route.ts` (Next.js)
- `صدای رابین/api/index.js` (Express)
- `صدای رابین/api/routes/ai.js` (Express Routes)
- `docker-compose.yml` (Docker)

## 💰 هزینه‌ها

### Claude 3 Haiku (توصیه می‌شه)
- Input: $0.25 / 1M tokens
- Output: $1.25 / 1M tokens
- مناسب برای: استفاده روزمره

### مثال محاسبه:
- 1000 مکالمه در روز
- هر مکالمه ~500 token
- هزینه روزانه: ~$0.50
- هزینه ماهانه: ~$15

## 🎉 نتیجه

با استفاده از فایل `.env.unified` و اجرای اسکریپت `unify-env-files.sh`:

✅ **همه چیز خودکار تنظیم میشه!**

فقط کافیه:
```bash
bash unify-env-files.sh
```

و تمام! 🚀

---

**نکته مهم:** 
API Key فعلی در فایل `.env.unified` موجود است:
```
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
```

اگر می‌خوای API Key خودت رو استفاده کنی، فقط کافیه جایگزینش کنی! ✨
