# 🔧 خلاصہ اصلاحات Deployment

## 🎯 مشکلات حل‌شده

### 1. 🔴 MySQL Connection Error
**مشکل:** `Access denied for user 'crm_app_user'@'172.18.0.4'`

**علل:**
- `MYSQL_ROOT_PASSWORD` با `_ROOT` پسورد متفاوت بود
- phpMyAdmin از پسورد اشتباه استفاده می‌کرد

**اصلاحات:**
- ✅ `docker-compose.yml` - ROOT password و app password یکسان شد
- ✅ `docker-compose.memory-optimized.yml` - همان اصلاح
- ✅ Character set و collation اضافه‌شد

---

### 2. 🔴 Rabin Voice API 500 Error
**مشکل:** `POST https://crm.robintejarat.com/rabin-voice/api/ai 500 (Internal Server Error)`
**Root Cause:** `OpenRouter API error: 401 - {"error":{"message":"No auth credentials found","code":401}}`

**علل:**
- Express API server داخل Rabin Voice اجرا نمی‌شد (فقط Next.js میرفت)
- `OPENROUTER_API_KEY` تنظیم نشده بود

**اصلاحات:**
- ✅ `صدای رابین/start.sh` - Script جدید برای اجرای Express + Next.js
- ✅ `صدای رابین/Dockerfile` - استفاده از `start.sh` بجای `node server.js`
- ✅ Nginx config - routing `/rabin-voice/` به `/` داخل container
- ✅ `setup-all-env.sh` - بهتر شدن OpenRouter API Key handling

---

### 3. 🟡 Environment Variables
**مشکل:** متغیرهای محیطی درست تنظیم نمی‌شدند

**اصلاحات:**
- ✅ `setup-all-env.sh` - بک‌آپ `.env` موجود قبل از overwrite
- ✅ OpenRouter API Key با fallback variable
- ✅ بهتر شدن بررسی متغیرهای محیطی

---

### 4. 🟡 Pre-Deployment Checks
**مشکل:** `check-env-before-deploy.sh` API Key را درست بررسی نمی‌کرد

**اصلاحات:**
- ✅ بهتر شدن OpenRouter API Key validation
- ✅ تفریق بین "تنظیم نشده" و "غیر معتبر"
- ✅ بهتر شدن پیام‌های خطا

---

## 📁 فایل‌های تغیر‌یافته

| فایل | تغییرات |
|------|---------|
| `setup-all-env.sh` | ✅ بک‌آپ و بهتر شدن OpenRouter handling |
| `check-env-before-deploy.sh` | ✅ بهتر شدن validation |
| `deploy-server.sh` | ✅ Nginx config برای rabin-voice |
| `docker-compose.yml` | ✅ MySQL password اصلاح، charset و collation |
| `docker-compose.memory-optimized.yml` | ✅ همان MySQL اصلاحات |
| `صدای رابین/start.sh` | ✨ فایل جدید - اجرای Express + Next.js |
| `صدای رابین/Dockerfile` | ✅ استفاده از `start.sh` |

---

## 🚀 نحوه Deployment

### Step 1: تنظیم ENV (تا یکبار)
```bash
bash setup-all-env.sh
```

### Step 2: تنظیم OpenRouter API Key
```bash
nano "صدای رابین/.env"
# جایگزین کنید: OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

### Step 3: بررسی تنظیمات
```bash
bash check-env-before-deploy.sh
```

### Step 4: Deploy
```bash
bash deploy-server.sh
```

---

## 🧪 آزمایش

### بررسی containerها
```bash
docker-compose ps
```

### بررسی لاگ‌های Rabin Voice
```bash
docker-compose logs -f rabin-voice
```

### تست API
```bash
# Test Express API
curl http://localhost:3001/api/health

# Test Next.js
curl http://localhost:3000
```

---

## ✨ نکات مهم

1. **MySQL Password:** الآن `1234` است (تا database و app user)
2. **Express Server:** الآن درون Rabin Voice container اجرا می‌شود
3. **Nginx Routing:** `/rabin-voice/` به `/` داخل container proxy می‌شود
4. **OpenRouter API:** الزامی است برای عملکرد AI

---

## 🆘 اگر مشکلی پیش‌آمد

1. **لاگ‌ها را بررسی کنید:**
   ```bash
   docker-compose logs -f
   ```

2. **متغیرهای محیطی را بررسی کنید:**
   ```bash
   cat .env | grep -E "DATABASE|OPENROUTER"
   ```

3. **تنظیمات را دوباره انجام دهید:**
   ```bash
   bash setup-all-env.sh
   bash check-env-before-deploy.sh
   ```

4. **کامل پاکسازی (مراقب باشید - داده‌ها حذف می‌شود):**
   ```bash
   bash deploy-server.sh --clean
   ```

---

**✅ تمام اصلاحات انجام شد!**

اب دستور زیر را اجرا کنید:
```bash
bash setup-all-env.sh
nano "صدای رابین/.env"
bash check-env-before-deploy.sh
bash deploy-server.sh
```