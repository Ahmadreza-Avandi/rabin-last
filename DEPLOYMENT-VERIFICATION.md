# ✅ چک‌لیست تکمیل دیپلوی - Deployment Verification

> **آخرین بروزرسانی**: هنگام دیپلوی
> **وضعیت**: ✅ آماده برای Production

---

## 📋 پیش‌نیازهای دیپلوی

### ✅ 1. فایل‌های دیتابیس
- [x] `database/crm_system.sql` - ✅ موجود
- [x] `database/saas_master.sql` - ✅ موجود  
- [x] `database/init.sql` - ✅ خودکار generate شود

### ✅ 2. فایل‌های Environment
- [x] `.env` - Root configuration
- [x] `.env.server` یا `.env.server.template` - برای تنظیم
- [x] `صدای رابین/.env` - Rabin Voice configuration

### ✅ 3. فایل‌های Nginx
- [x] `nginx/default.conf` - SSL + HTTPS config
- [x] `nginx/active.conf` - Deploy-time generated config
- [x] Reverse proxy برای `/rabin-voice/` path

---

## 🚀 مراحل دیپلوی

### مرحله 1️⃣: اجرای Setup (First Time Only)
```bash
bash setup-all-env.sh
```
✅ **نتایج مورد انتظار:**
- `.env` file ایجاد شود
- `صدای رابین/.env` ایجاد شود
- DATABASE_PASSWORD تولید شود
- تمام ENV variables آماده باشند

---

### مرحله 2️⃣: اجرای Deploy
```bash
bash deploy-server.sh
```
✅ **نتایج مورد انتظار:**
- ✅ init.sql generate شود (با DATABASE_PASSWORD sync)
- ✅ crm_system.sql + saas_master.sql import شوند
- ✅ صدای رابین/.env آپدیت شود
- ✅ Docker containers build و start شوند
- ✅ Nginx configured شود
- ✅ SSL certificates handle شوند

---

## 🔍 چک‌کردن DATABASE SYNC

### Step 1: بررسی root `.env`
```bash
cat .env | grep DATABASE_PASSWORD
```
**مورد انتظار:**
```
DATABASE_PASSWORD=1234
```

### Step 2: بررسی صدای رابین `.env`
```bash
cat صدای رابین/.env | grep DATABASE_PASSWORD
```
**مورد انتظار:**
```
DATABASE_PASSWORD=1234
```

### Step 3: تأیید Sync
```bash
# باید یکسان باشند!
diff <(grep DATABASE_PASSWORD .env) <(grep DATABASE_PASSWORD صدای رابین/.env)
```
**مورد انتظار:** `خروجی خالی` (یعنی یکسانند)

---

## 🗄️ چک‌کردن Database Import

### Step 1: بررسی MySQL Container
```bash
docker exec crm-mysql mysql -u root -p$DATABASE_PASSWORD -e "SHOW DATABASES;"
```
**مورد انتظار:**
```
crm_system    ✅
saas_master   ✅
```

### Step 2: بررسی Permissions
```bash
docker exec crm-mysql mysql -u root -p$DATABASE_PASSWORD -e "SHOW GRANTS FOR 'crm_app_user'@'%';"
```
**مورد انتظار:**
```
GRANT ALL PRIVILEGES ON `crm_system`.* ...  ✅
```

### Step 3: بررسی Tables
```bash
docker exec crm-mysql mysql -u crm_app_user -p$DATABASE_PASSWORD crm_system -e "SHOW TABLES;"
```
**مورد انتظار:**
```
activities
contacts
customers
deals
... (تمام tables از crm_system.sql)  ✅
```

---

## 🌐 چک‌کردن صدای رابین Deployment

### Step 1: بررسی Rabin Voice Container
```bash
docker ps | grep rabin-voice
```
**مورد انتظار:**
```
crm-rabin-voice    Up (healthy)  ✅
```

### Step 2: بررسی Database Connection
```bash
curl http://localhost:3001/rabin-voice/api/database?action=test-connection
```
**مورد انتظار:**
```json
{
  "success": true,
  "message": "اتصال به دیتابیس موفق"  ✅
}
```

### Step 3: بررسی Nginx Proxy
```bash
curl -I http://crm.robintejarat.com/rabin-voice/
```
**مورد انتظار:**
```
HTTP/1.1 200 OK
```

---

## 🌍 چک‌کردن Domain Access

### URL در Browser:
```
https://crm.robintejarat.com/rabin-voice/
```

### بررسی نتایج:
- [ ] صفحه Rabin Voice نمایش داده شود
- [ ] بدون 404 error
- [ ] بدون CORS errors  
- [ ] بدون database connection errors
- [ ] Console errors نباشند

---

## 🔧 Troubleshooting

### اگر صدای رابین دسترسی‌پذیر نیست:

#### ❌ Problem: 404 on `/rabin-voice/`
```bash
# بررسی nginx routing
docker exec crm-nginx nginx -T

# بررسی rabin-voice container
docker logs crm-rabin-voice | tail -20
```

#### ❌ Problem: Database Connection Failed
```bash
# بررسی DATABASE_PASSWORD sync
grep DATABASE_PASSWORD .env صدای رابین/.env

# بررسی MySQL permissions
docker exec crm-mysql mysql -u crm_app_user -p1234 crm_system -e "SELECT 1;"
```

#### ❌ Problem: CORS Error
```bash
# بررسی headers
curl -I -H "Origin: https://crm.robintejarat.com" http://localhost:3001/rabin-voice/api/ai
```

---

## 📊 Health Check Commands

### بررسی تمام سرویس‌ها:
```bash
# Docker status
docker ps -a

# MySQL health
docker exec crm-mysql mysql -u root -p$DATABASE_PASSWORD -e "SHOW PROCESSLIST;"

# Nginx status
docker exec crm-nginx curl -s http://localhost/health

# Next.js status
docker exec crm-nextjs curl -s http://localhost:3000/api/health

# Rabin Voice status
docker exec crm-rabin-voice curl -s http://localhost:3001/rabin-voice/api/database?action=test-connection
```

---

## ✨ نتایج موفق

### ✅ اگر همه موارد بالا درست باشند:

1. **MySQL**: دیتابیس‌ها import شدند ✅
2. **صدای رابین**: روی `https://crm.robintejarat.com/rabin-voice/` accessible است ✅
3. **DATABASE_PASSWORD**: synced است ✅
4. **Nginx**: reverse proxy کار می‌کند ✅
5. **API Routes**: `اتصال به دیتابیس موفق` ✅

---

## 🎉 تبریک!

### سیستم آماده است برای:
- ✅ Production Deployment
- ✅ User Access
- ✅ Real-time Operations

---

## 📝 نکات مهم

| موضوع | نکته |
|------|------|
| **Database Sync** | DATABASE_PASSWORD باید در هر اجرای `deploy-server.sh` sync شود |
| **Container Dependencies** | MySQL ⟶ Rabin Voice ⟶ Next.js ⟶ Nginx |
| **Nginx Config** | `nginx/active.conf` هر بار تولید می‌شود |
| **Rabin Voice Path** | `/rabin-voice/` (با slash انتها) |
| **SSL Certificates** | Let's Encrypt certificates در `/etc/letsencrypt/` ذخیره شوند |

---

## 🔐 Security Checklist

- [ ] DATABASE_PASSWORD قوی است (نه `1234`)
- [ ] OPENROUTER_API_KEY مخفی است
- [ ] SSL certificates موجود هستند
- [ ] phpMyAdmin به URL مخفی دسترسی‌دار است
- [ ] تمام sensitive data در `.env` است (نه در کد)

---

**✅ آپدیت شده:** $(date)**
**📌 نسخه:** Deployment v2.1