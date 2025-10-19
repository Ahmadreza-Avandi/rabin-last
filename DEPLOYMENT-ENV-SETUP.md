# 🚀 راهنمای تنظیم ENV قبل از Deploy

## 📋 خلاصه سریع

قبل از اجرای `deploy-server.sh`، باید **2 فایل ENV** رو تنظیم کنی:

1. **`.env`** - در ریشه پروژه (برای CRM و تنظیمات عمومی)
2. **`صدای رابین/.env`** - داخل پوشه صدای رابین (برای کلیدهای API)

---

## 🎯 مرحله 1: تنظیم ENV ریشه پروژه

### گام 1.1: کپی فایل template

```bash
# در ریشه پروژه
cp .env.unified .env
```

یا اگر `.env` از قبل داری، فقط چک کن که این متغیرها رو داره:

### گام 1.2: ویرایش `.env` در ریشه پروژه

```bash
nano .env
# یا
vim .env
```

### گام 1.3: تنظیم متغیرهای مهم

```env
# ===========================================
# 🗄️ Database Configuration
# ===========================================
DATABASE_HOST=mysql                    # برای Docker
DATABASE_USER=crm_app_user
DATABASE_PASSWORD=1234                 # ⚠️ تغییر بده!
DATABASE_NAME=crm_system

# Master Database (برای SaaS)
MASTER_DB_HOST=mysql
MASTER_DB_USER=root
MASTER_DB_PASSWORD=                    # ⚠️ تنظیم کن!

# ===========================================
# 🔐 Security
# ===========================================
JWT_SECRET=jwt_secret_key_production_2024_crm_system        # ⚠️ تغییر بده!
NEXTAUTH_SECRET=crm_super_secret_key_production_2024        # ⚠️ تغییر بده!
DB_ENCRYPTION_KEY=0329f3e3b5cd43ee84e81b2799f778c6d3b7d774f1a54950b9f7efc9ab2708ac

# ===========================================
# 🌐 Application
# ===========================================
NODE_ENV=production
NEXTAUTH_URL=https://crm.robintejarat.com    # ⚠️ دامنه خودت رو بزار!

# ===========================================
# 📧 Email (اختیاری)
# ===========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com              # ⚠️ ایمیل خودت
EMAIL_PASS=your-app-password                 # ⚠️ App Password از Gmail

# ===========================================
# 🌐 Google OAuth (اختیاری)
# ===========================================
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

---

## 🎤 مرحله 2: تنظیم ENV صدای رابین

### گام 2.1: رفتن به پوشه صدای رابین

```bash
cd "صدای رابین"
```

### گام 2.2: اجرای اسکریپت setup

```bash
bash setup-env.sh
```

یا دستی:

```bash
cp .env.example .env
```

### گام 2.3: ویرایش `صدای رابین/.env`

```bash
nano .env
# یا
vim .env
```

### گام 2.4: تنظیم کلیدهای API (الزامی!)

```env
# ===========================================
# 🤖 OpenRouter AI Configuration (الزامی!)
# ===========================================
OPENROUTER_API_KEY=sk-or-v1-YOUR-REAL-API-KEY-HERE
RABIN_VOICE_OPENROUTER_API_KEY=sk-or-v1-YOUR-REAL-API-KEY-HERE

# مدل (اختیاری)
OPENROUTER_MODEL=anthropic/claude-3-haiku
RABIN_VOICE_OPENROUTER_MODEL=anthropic/claude-3-haiku

# ===========================================
# 🔊 TTS Configuration (اختیاری)
# ===========================================
TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech
RABIN_VOICE_TTS_API_URL=https://api.ahmadreza-avandi.ir/text-to-speech

# ===========================================
# 🗄️ Database (معمولاً نیازی به تغییر نیست)
# ===========================================
DATABASE_HOST=mysql
DATABASE_USER=crm_app_user
DATABASE_PASSWORD=1234
DATABASE_NAME=crm_system
```

### گام 2.5: دریافت OpenRouter API Key

1. برو به: **https://openrouter.ai/**
2. ثبت‌نام کن یا لاگین کن
3. به بخش **"Keys"** برو
4. روی **"Create New Key"** کلیک کن
5. یک نام بده (مثلاً: "Rabin Voice Production")
6. کلید رو کپی کن (شبیه: `sk-or-v1-...`)
7. در فایل `صدای رابین/.env` جایگزین کن

### گام 2.6: برگشت به ریشه پروژه

```bash
cd ..
```

---

## ✅ مرحله 3: بررسی نهایی

### چک‌لیست قبل از Deploy

```bash
# 1. بررسی فایل .env در ریشه
[ -f .env ] && echo "✅ .env موجود است" || echo "❌ .env موجود نیست"

# 2. بررسی فایل .env در صدای رابین
[ -f "صدای رابین/.env" ] && echo "✅ صدای رابین/.env موجود است" || echo "❌ صدای رابین/.env موجود نیست"

# 3. بررسی OpenRouter API Key
grep -q "sk-or-v1-" "صدای رابین/.env" && echo "✅ API Key تنظیم شده" || echo "❌ API Key تنظیم نشده"

# 4. بررسی Database Password
grep -q "DATABASE_PASSWORD=" .env && echo "✅ Database Password موجود است" || echo "❌ Database Password موجود نیست"
```

### بررسی دستی

```bash
# نمایش متغیرهای مهم (بدون نمایش مقادیر واقعی)
echo "📋 بررسی تنظیمات:"
echo ""
echo "1️⃣  ریشه پروژه (.env):"
grep -E "^(DATABASE_|NEXTAUTH_|JWT_)" .env | sed 's/=.*/=***/'
echo ""
echo "2️⃣  صدای رابین (.env):"
grep -E "^(OPENROUTER_|TTS_)" "صدای رابین/.env" | sed 's/=.*/=***/'
```

---

## 🚀 مرحله 4: اجرای Deploy

حالا که همه چیز آماده است، می‌تونی deploy رو اجرا کنی:

```bash
# اجرای deploy معمولی
bash deploy-server.sh

# یا اجرای deploy با پاکسازی کامل
bash deploy-server.sh --clean
```

---

## 📁 ساختار نهایی فایل‌ها

```
پروژه/
├── .env                          ✅ تنظیم شده (CRM و عمومی)
├── .env.server                   ✅ خودکار از .env کپی می‌شه
├── .env.unified                  📋 Template (برای مرجع)
├── deploy-server.sh              🚀 اسکریپت deploy
├── docker-compose.yml            🐳 تنظیمات Docker
│
└── صدای رابین/
    ├── .env                      ✅ تنظیم شده (کلیدهای API)
    ├── .env.example              📋 Template
    ├── .gitignore                🔒 .env رو ignore می‌کنه
    ├── setup-env.sh              🔧 اسکریپت setup
    └── README.md                 📖 راهنما
```

---

## 🔐 نکات امنیتی مهم

### ⚠️ قبل از Push به GitHub

```bash
# 1. بررسی .gitignore
cat .gitignore | grep ".env"

# باید این خطوط رو ببینی:
# .env
# .env.local
# .env.production
# .env.*.local

# 2. بررسی فایل‌های staged
git status

# 3. اگر .env در لیست بود، حذفش کن:
git reset .env
git reset "صدای رابین/.env"

# 4. اضافه کردن به .gitignore اگر نیست
echo ".env" >> .gitignore
echo "صدای رابین/.env" >> .gitignore
```

### ✅ فایل‌هایی که باید commit بشن

- ✅ `.env.example`
- ✅ `.env.unified`
- ✅ `صدای رابین/.env.example`
- ✅ `.gitignore`

### ❌ فایل‌هایی که نباید commit بشن

- ❌ `.env`
- ❌ `.env.local`
- ❌ `.env.server`
- ❌ `صدای رابین/.env`

---

## 🔍 عیب‌یابی

### مشکل 1: صدای رابین راه‌اندازی نمی‌شه

```bash
# بررسی لاگ
docker logs crm-rabin-voice

# دنبال این خطاها بگرد:
# ❌ OPENROUTER_API_KEY is not configured
# ❌ Missing ✗

# راه‌حل:
cd "صدای رابین"
nano .env
# API Key رو تنظیم کن
cd ..
docker-compose restart rabin-voice
```

### مشکل 2: دیتابیس متصل نمی‌شه

```bash
# بررسی لاگ MySQL
docker logs crm-mysql

# بررسی تنظیمات
cat .env | grep DATABASE

# راه‌حل:
# 1. پسورد دیتابیس رو چک کن
# 2. یوزر و دیتابیس رو چک کن
# 3. Docker رو restart کن
docker-compose restart mysql
```

### مشکل 3: Next.js build نمی‌شه

```bash
# بررسی لاگ
docker logs crm-nextjs

# راه‌حل:
# 1. .env رو چک کن
# 2. NEXTAUTH_URL رو چک کن
# 3. Rebuild کن
docker-compose up --build nextjs
```

---

## 📊 خلاصه مراحل

### قبل از Deploy:

1. ✅ کپی `.env.unified` به `.env` در ریشه
2. ✅ ویرایش `.env` و تنظیم Database و Security
3. ✅ رفتن به `صدای رابین/`
4. ✅ اجرای `bash setup-env.sh`
5. ✅ ویرایش `صدای رابین/.env` و تنظیم OpenRouter API Key
6. ✅ برگشت به ریشه پروژه
7. ✅ بررسی نهایی با چک‌لیست

### بعد از Deploy:

1. ✅ بررسی لاگ‌ها: `docker logs crm-rabin-voice`
2. ✅ تست صدای رابین: `https://crm.robintejarat.com/rabin-voice`
3. ✅ تست CRM: `https://crm.robintejarat.com`

---

## 🎉 آماده Deploy!

حالا می‌تونی با خیال راحت deploy کنی:

```bash
bash deploy-server.sh
```

موفق باشی! 🚀

---

**نکته:** اگر سوالی داشتی یا مشکلی پیش اومد، فایل‌های زیر رو بخون:
- `ENV-UNIFICATION-GUIDE.md` - راهنمای کامل ENV
- `RABIN-VOICE-AI-CONFIG.md` - راهنمای تنظیم هوش مصنوعی
- `RABIN-VOICE-TTS-CONFIG.md` - راهنمای تنظیم پخش صدا
- `صدای رابین/README.md` - راهنمای صدای رابین
