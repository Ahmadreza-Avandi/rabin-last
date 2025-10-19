# 🎤 راهنمای تنظیم API پخش صدا (TTS) برای صدای رابین

## 🔍 بررسی کد

صدای رابین از **2 متغیر ENV** برای API پخش صدا استفاده می‌کنه:

### 1️⃣ در Next.js Route (`صدای رابین/app/api/tts/route.ts`)
```typescript
const ttsUrl = process.env.TTS_API_URL || 'https://api.ahmadreza-avandi.ir/text-to-speech';
```

### 2️⃣ در Express API (`صدای رابین/api/index.js`)
```javascript
TTS_API_URL: process.env.TTS_API_URL || 
             process.env.RABIN_VOICE_TTS_API_URL || 
             'https://api.ahmadreza-avandi.ir/text-to-speech'
```

## 📋 اولویت استفاده از متغیرها

صدای رابین به ترتیب این متغیرها رو چک می‌کنه:

1. **`TTS_API_URL`** (اولویت اول)
2. **`RABIN_VOICE_TTS_API_URL`** (اولویت دوم)
3. **مقدار پیش‌فرض**: `https://api.ahmadreza-avandi.ir/text-to-speech`

## ✅ راه‌حل: استفاده از هر دو متغیر

برای اطمینان، **هر دو متغیر** رو در فایل `.env` تنظیم کن:

### در `.env.unified` (قبلاً اضافه شده ✅)
```env
# ===========================================
# 🎤 Rabin Voice Assistant Configuration
# ===========================================
RABIN_VOICE_TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech

# Alternative names for compatibility
TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
```

## 🎯 کلید API رو کجا بذاری؟

### گزینه 1: استفاده از فایل یکپارچه (توصیه می‌شه ✅)

فایل `.env.unified` که من ساختم **قبلاً این تنظیمات رو داره**:

```env
# خط 73-75
RABIN_VOICE_TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech

# خط 78-80 (برای سازگاری)
TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
```

فقط کافیه اسکریپت یکپارچه‌سازی رو اجرا کنی:
```bash
bash unify-env-files.sh
```

### گزینه 2: اضافه کردن دستی

اگر می‌خوای دستی اضافه کنی، این خطوط رو به فایل‌های زیر اضافه کن:

#### `.env` (Production)
```env
# TTS Configuration
RABIN_VOICE_TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
```

#### `.env.local` (Development)
```env
# TTS Configuration
RABIN_VOICE_TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
```

#### `.env.server` (Docker)
```env
# TTS Configuration
RABIN_VOICE_TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
```

## 🔧 تنظیمات Docker

در `docker-compose.yml` این متغیرها قبلاً تنظیم شدن:

```yaml
rabin-voice:
  env_file:
    - .env
    - .env.server
  environment:
    - RABIN_VOICE_TTS_API_URL=${RABIN_VOICE_TTS_API_URL:-https://api.ahmadreza-avandi.ir/text-to-speech}
```

## 🧪 تست تنظیمات

### 1. بررسی متغیر در Development
```bash
# در terminal
echo $TTS_API_URL
echo $RABIN_VOICE_TTS_API_URL
```

### 2. بررسی در Docker
```bash
# بررسی متغیرهای کانتینر
docker exec crm-rabin-voice env | grep TTS

# باید این خروجی رو ببینی:
# TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
# RABIN_VOICE_TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
```

### 3. بررسی لاگ
```bash
# لاگ صدای رابین
docker logs crm-rabin-voice | grep TTS

# باید این خط رو ببینی:
# TTS_API_URL: https://api.ahmadreza-avandi.ir/text-to-speech
```

### 4. تست عملکرد
```bash
# باز کردن صفحه صدای رابین
# http://localhost:3001/rabin-voice (development)
# https://crm.robintejarat.com/rabin-voice (production)

# تست TTS:
# 1. متنی بنویس
# 2. دکمه "تبدیل به صدا" رو بزن
# 3. باید صدا پخش بشه
```

## 🔍 عیب‌یابی

### مشکل: صدا پخش نمی‌شه

**راه‌حل 1: بررسی متغیر**
```bash
# در کانتینر
docker exec crm-rabin-voice env | grep TTS_API_URL

# اگر خالی بود:
# 1. فایل .env رو چک کن
# 2. Docker رو rebuild کن
docker-compose down
docker-compose up --build
```

**راه‌حل 2: بررسی لاگ**
```bash
# لاگ کامل
docker logs crm-rabin-voice -f

# دنبال این خطاها بگرد:
# ❌ TTS API Error
# ❌ Cannot connect to TTS API
```

**راه‌حل 3: تست API مستقیم**
```bash
# تست با curl
curl -X POST https://api.ahmadreza-avandi.ir/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{
    "text": "سلام",
    "speaker": "3",
    "checksum": "1",
    "filePath": "true",
    "base64": "0"
  }'

# باید پاسخ JSON با filePath بگیری
```

### مشکل: متغیر خوانده نمی‌شه

**راه‌حل:**
```bash
# 1. بررسی فایل .env
cat .env | grep TTS

# 2. بارگذاری مجدد
source .env

# 3. Restart سرویس
npm run dev  # development
docker-compose restart rabin-voice  # production
```

## 📊 خلاصه

### ✅ متغیرهای مورد نیاز:
```env
TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
RABIN_VOICE_TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
```

### ✅ فایل‌های مورد نیاز:
- `.env` (production)
- `.env.local` (development)
- `.env.server` (Docker)

### ✅ مکان‌های استفاده:
- `صدای رابین/app/api/tts/route.ts` (Next.js)
- `صدای رابین/api/index.js` (Express)
- `docker-compose.yml` (Docker)

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
اگر می‌خوای از API دیگه‌ای استفاده کنی، فقط کافیه URL رو تغییر بدی:
```env
TTS_API_URL=https://your-custom-tts-api.com/endpoint
RABIN_VOICE_TTS_API_URL=https://your-custom-tts-api.com/endpoint
```
