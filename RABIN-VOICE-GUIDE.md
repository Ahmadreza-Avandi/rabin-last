# 🎤 راهنمای دستیار صوتی رابین (Rabin Voice)

## 📋 توضیحات

**دستیار صوتی رابین** یک وب اپلیکیشن Next.js است که با Express.js API یکپارچه شده و قابلیت‌های هوش مصنوعی و پردازش صوتی را ارائه می‌دهد.

این سرویس شامل:
- 🌐 **وب اپلیکیشن Next.js** - رابط کاربری تعاملی برای صحبت با دستیار
- 🔌 **Express.js API** - backend برای پردازش درخواست‌ها
- 🤖 **هوش مصنوعی** - استفاده از OpenRouter برای پاسخ‌های هوشمند
- 🔊 **Text-to-Speech** - تبدیل متن به صوت

## 🌐 دسترسی به Rabin Voice

### 1. **وب اپلیکیشن (Web App)**
```
https://crm.robintejarat.com/rabin-voice/
```

این آدرس یک رابط کاربری تعاملی نمایش می‌دهد که می‌توانید:
- با دستیار صوتی صحبت کنید
- پیام‌های متنی ارسال کنید
- پاسخ‌های صوتی دریافت کنید

### 2. **API Endpoints**

Rabin Voice API endpoints مختلفی دارد:

```bash
# تست سلامت سرویس
curl https://crm.robintejarat.com/rabin-voice/api/

# چت با دستیار
curl -X POST https://crm.robintejarat.com/rabin-voice/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "سلام"}'

# تبدیل متن به صوت
curl -X POST https://crm.robintejarat.com/rabin-voice/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "سلام، من دستیار رابین هستم"}'
```

## 🔧 تنظیمات

### متغیرهای محیطی مهم:

```env
# OpenRouter API Key (برای هوش مصنوعی)
OPENROUTER_API_KEY=sk-or-v1-xxxxx...

# TTS API (برای تبدیل متن به صوت)
TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech

# Database
DATABASE_HOST=mysql
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=crm_system

# Port
PORT=3001
```

## 📊 بررسی وضعیت

### چک کردن لاگ‌ها:
```bash
# لاگ‌های Rabin Voice
docker logs crm_rabin_voice

# لاگ‌های زنده
docker logs -f crm_rabin_voice

# لاگ‌های داخل کانتینر
docker exec crm_rabin_voice cat logs/api.log
```

### راه‌اندازی مجدد:
```bash
# راه‌اندازی مجدد فقط Rabin Voice
docker-compose restart rabin-voice

# یا با فایل deploy
docker-compose -f docker-compose.deploy.yml restart rabin-voice
```

## 🚫 نکات مهم

1. **Rabin Voice وب اپ ندارد** - فقط یک API service است
2. **دسترسی از طریق nginx** - همه درخواست‌ها از طریق `/rabin-voice/` route می‌شوند
3. **نیاز به OpenRouter API Key** - بدون این کلید، قابلیت‌های AI کار نمی‌کنند
4. **پورت 3001** - این پورت فقط داخل Docker network در دسترس است

## 🔍 عیب‌یابی

### مشکل: API پاسخ نمی‌دهد
```bash
# بررسی وضعیت کانتینر
docker ps | grep rabin-voice

# بررسی لاگ‌ها
docker logs crm_rabin_voice --tail 50

# تست مستقیم از داخل سرور
curl http://localhost/rabin-voice/
```

### مشکل: خطای Database Connection
```bash
# بررسی اتصال MySQL
docker exec crm_mysql mariadb -u root -e "SELECT 1;"

# بررسی متغیرهای محیطی
docker exec crm_rabin_voice env | grep DATABASE
```

### مشکل: OpenRouter API Key
```bash
# بررسی کلید API
docker exec crm_rabin_voice env | grep OPENROUTER

# ویرایش .env
nano "صدای رابین/.env"

# راه‌اندازی مجدد
docker-compose restart rabin-voice
```

## 📱 استفاده در CRM

برای استفاده از Rabin Voice در سیستم CRM اصلی، باید از طریق API endpoints آن درخواست بزنید.

مثال در Next.js:
```typescript
// استفاده از Rabin Voice API
const response = await fetch('/rabin-voice/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'سلام، چطور می‌تونی کمکم کنی؟'
  })
});

const data = await response.json();
console.log(data);
```

## 🎯 خلاصه

- ✅ Rabin Voice یک **API Service** است
- ✅ از طریق `https://crm.robintejarat.com/rabin-voice/` در دسترس است
- ✅ برای استفاده نیاز به **OpenRouter API Key** دارد
- ❌ وب اپ جداگانه **ندارد**
- ❌ UI مستقل **ندارد**

برای استفاده از قابلیت‌های Rabin Voice، باید از طریق CRM اصلی یا API calls مستقیم استفاده کنید.
