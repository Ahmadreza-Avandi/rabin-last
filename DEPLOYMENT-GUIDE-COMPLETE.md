# 🚀 راهنمای کامل Deployment روی سرور

## 📍 خلاصه مراحل

```bash
# مرحله 1️⃣: تنظیم ENV variables و دیتابیس (فقط اول بار)
bash setup-all-env.sh

# مرحله 2️⃣: Deploy و Build Docker containers
bash deploy-server.sh

# مرحله 3️⃣: تست کامل
bash test-deployment.sh
```

---

## 🔧 تفصیلات مراحل

### مرحله 1️⃣: `setup-all-env.sh` - تنظیم اول بار

**هدف:** 
- تنظیم تمام ENV variables
- ایجاد پسورد قوی برای MySQL
- تنظیم Rabin Voice configuration

**اجرا روی سرور:**
```bash
cd /root/crm-deployment  # یا جایی که پروژه قرار دارد
bash setup-all-env.sh
```

**نتایج مورد انتظار:**
```
✅ .env ایجاد شد
✅ .env.server ایجاد شد
✅ صدای رابین/.env ایجاد شد
✅ DATABASE_PASSWORD: ******* (محفوظ)
✅ NEXTAUTH_SECRET: ******* (محفوظ)
```

**نکات:**
- این اسکریپت **فقط یک بار** اجرا می‌شود (اول deployment)
- اگر `.env` موجود است، پسورد قدیمی استفاده می‌شود (safe)
- برای **تجدید پسورد**، `.env` را پاک کنید و دوباره اجرا کنید:
  ```bash
  rm .env
  bash setup-all-env.sh
  ```

---

### مرحله 2️⃣: `deploy-server.sh` - Build و Run Containers

**هدف:**
- Build تمام Docker images
- Create و Start containers
- Setup Nginx proxy
- Import databases
- Test connectivity

**اجرا روی سرور:**
```bash
bash deploy-server.sh
```

**یا برای پاکسازی کامل (اگر مشکل داشت):**
```bash
bash deploy-server.sh --clean
```

**نتایج مورد انتظار:**
```
✅ Docker build: موفق
✅ Containers running:
   - crm-mysql (دیتابیس)
   - crm-nextjs (CRM Application)
   - crm-rabin-voice (Voice Assistant)
   - crm-nginx (Web Server)
   - crm-phpmyadmin (Database Management)

✅ Database import: موفق
✅ Nginx configured
```

**زمان اجرا:** 5-15 دقیقه (بستگی به سرور دارد)

**نکات:**
- اگر ترک شود (Ctrl+C)، دوباره اجرا کنید
- اگر build فشل شود، `--clean` استفاده کنید:
  ```bash
  bash deploy-server.sh --clean
  ```

---

### مرحله 3️⃣: `test-deployment.sh` - تست کامل

**هدف:**
- تست تمام سرویس‌ها
- بررسی database connectivity
- بررسی API endpoints
- بررسی Rabin Voice
- بررسی دامنه

**اجرا روی سرور:**
```bash
bash test-deployment.sh
```

**نتایج مورد انتظار:**
```
✅ MySQL: آنلاین
✅ Next.js: آنلاین
✅ Rabin Voice: آنلاین
✅ Nginx: آنلاین
✅ API Health: موفق
✅ Database: Connected
✅ Domain: Working
```

---

## 🌍 دسترسی بعد از Deployment

### URLs دسترسی:

```
# 🌐 Main CRM Application
https://crm.robintejarat.com

# 🎤 Rabin Voice Assistant
https://crm.robintejarat.com/rabin-voice

# 🗄️ PhpMyAdmin (Database Management)
https://crm.robintejarat.com/phpmyadmin
   Username: root
   Password: [DATABASE_PASSWORD]

# ℹ️ API Health Check
https://crm.robintejarat.com/api/health
https://crm.robintejarat.com/rabin-voice/api/health
```

---

## 🔍 تشخیص مشکلات

### ❌ اگر MySQL اتصال را رد کند:
```bash
# بررسی MySQL container
docker ps | grep mysql

# بررسی logs
docker logs crm-mysql | tail -20

# تست اتصال مستقیم
docker exec crm-mysql mysql -u root -p$DATABASE_PASSWORD -e "SHOW DATABASES;"
```

### ❌ اگر Rabin Voice 502 error بدهد:
```bash
# بررسی Rabin Voice logs
docker logs crm-rabin-voice | tail -50

# بررسی database connection
docker exec crm-rabin-voice curl -s http://localhost:3001/rabin-voice/api/database?action=test-connection

# بررسی اگر DATABASE_PASSWORD sync شده
grep DATABASE_PASSWORD .env صدای\ رابین/.env
```

### ❌ اگر Certificate issue داشت:
```bash
# بررسی certificates
sudo ls -la /etc/letsencrypt/live/crm.robintejarat.com/

# Renew certificates
sudo certbot renew --force-renewal
```

---

## 📊 Monitoring بعد از Deployment

### Health Check Commands:
```bash
# دید کلی تمام containers
docker ps -a

# Logs هر service
docker logs crm-mysql       # دیتابیس
docker logs crm-nextjs      # CRM app
docker logs crm-rabin-voice # Rabin Voice
docker logs crm-nginx       # Web Server

# Resource usage
docker stats

# Network test
docker network ls
docker network inspect crm-network
```

---

## 🔧 اجرای دوباره Deployment

### اگر فقط نیاز دارید Containers را restart کنید:
```bash
docker-compose restart
```

### اگر نیاز دارید فقط Rabin Voice را rebuild کنید:
```bash
docker-compose build rabin-voice
docker-compose up -d rabin-voice
```

### اگر نیاز دارید تمام چیز را از نو start کنید:
```bash
docker-compose down
bash deploy-server.sh --clean
```

---

## ✅ Checklist بعد از Deployment

- [ ] Containers تمام running هستند
- [ ] MySQL database import شده
- [ ] DATABASE_PASSWORD synced است
- [ ] `.env` تمام variables دارد
- [ ] `صدای رابین/.env` تمام variables دارد
- [ ] OPENROUTER_API_KEY تنظیم شده
- [ ] Domain DNS configured است
- [ ] SSL Certificate موجود است
- [ ] Main app در domain کار می‌کند
- [ ] Rabin Voice accessible است
- [ ] API health endpoints responding هستند

---

## 📝 نکات مهم

| موضوع | نکته |
|------|------|
| **Processing Time** | 5-15 دقیقه برای اول بار، 2-3 دقیقه برای rebuild |
| **Database Sync** | DATABASE_PASSWORD باید همه جا یکسان باشد |
| **Container Order** | MySQL → Rabin Voice → Next.js → Nginx |
| **Domain Setup** | DNS A record باید به server IP اشاره کند |
| **SSL Auto-Renewal** | Certbot خودکار certificates را renew می‌کند |
| **Memory** | اگر سرور < 2GB، script خودکار swap config می‌کند |

---

## 🆘 Emergency Commands

اگر مشکل اساسی داشت:

```bash
# مشاهده تمام logs
docker-compose logs -f --tail=100

# پاک کردن تمام containers (خطرناک!)
docker-compose down -v

# بازسازی کامل (خیلی خطرناک - دیتابیس حذف می‌شود!)
docker system prune -a --volumes
bash deploy-server.sh --clean
```

---

## ✨ موفقیت!

اگر تمام مراحل بدون خطا انجام شد:

✅ سیستم آماده برای **Production** است
✅ Users می‌توانند دسترسی داشته باشند
✅ Database secured است
✅ Rabin Voice فعال است

---

**ساخته شده:** 2025
**آخرین بروزرسانی:** Deploy Script v2.1