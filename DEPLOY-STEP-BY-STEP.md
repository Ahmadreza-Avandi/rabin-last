# 🚀 راهنمای گام به گام دیپلوی - از صفر تا صد

## 📋 پیش‌نیازها

قبل از شروع، مطمئن شوید این‌ها نصب هستند:
- Docker
- Docker Compose
- Git (اختیاری)

---

## مرحله 1️⃣: تنظیم فایل‌های .env

### گام 1.1: اجرای اسکریپت تنظیم خودکار

```bash
cd ~/rabin-last
bash setup-all-env.sh
```

**این اسکریپت:**
- فایل `.env` در ریشه پروژه می‌سازد
- فایل `صدای رابین/.env` می‌سازد
- پسوردهای امنیتی تولید می‌کند (JWT, NEXTAUTH)
- DATABASE_USER را به `root` تنظیم می‌کند
- DATABASE_PASSWORD را خالی می‌کند

### گام 1.2: بررسی فایل .env

```bash
cat .env | grep -E "DATABASE_USER|DATABASE_PASSWORD|DATABASE_URL"
```

**باید ببینید:**
```
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_URL=mysql://root@mysql:3306/crm_system
```

### گام 1.3: بررسی صدای رابین/.env

```bash
cat "صدای رابین/.env" | grep -E "DATABASE_USER|DATABASE_PASSWORD"
```

**باید ببینید:**
```
DATABASE_USER=root
DATABASE_PASSWORD=
```

### گام 1.4: (اختیاری) تنظیم OpenRouter API Key

اگر می‌خواهید Rabin Voice کار کند:

```bash
nano "صدای رابین/.env"
```

این خطوط را پیدا کنید و API Key خودتان را وارد کنید:
```
OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE
RABIN_VOICE_OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY_HERE
```

دریافت API Key از: https://openrouter.ai/keys

---

## مرحله 2️⃣: بررسی تنظیمات

### گام 2.1: اجرای اسکریپت بررسی

```bash
bash verify-all-configs.sh
```

**اگر خطا دیدید:**
- خطاها را یادداشت کنید
- به مرحله عیب‌یابی بروید
- بعد از اصلاح، دوباره این دستور را اجرا کنید

**اگر موفق بود:**
```
✅ همه چیز آماده برای دیپلوی است!
```

---

## مرحله 3️⃣: آماده‌سازی دیتابیس

### گام 3.1: بررسی فایل‌های SQL

```bash
ls -lh database/
```

**باید ببینید:**
- `crm_system.sql` یا `دیتاییس تغیر کرده.sql`
- `saas_master.sql` (اختیاری)

### گام 3.2: اگر فایل‌های SQL در جای دیگری هستند

```bash
# اگر در پوشه دیتابیس هستند
cp دیتابیس/*.sql database/

# یا اگر در ریشه پروژه هستند
cp *.sql database/
```

---

## مرحله 4️⃣: دیپلوی اولیه

### گام 4.1: متوقف کردن کانتینرهای قدیمی (اگر وجود دارند)

```bash
docker-compose down
```

### گام 4.2: پاکسازی کامل (اولین بار)

```bash
bash deploy-server.sh --clean
```

**این دستور:**
- همه کانتینرهای قدیمی را پاک می‌کند
- همه images قدیمی را پاک می‌کند
- Docker cache را پاک می‌کند
- Build جدید انجام می‌دهد
- همه سرویس‌ها را راه‌اندازی می‌کند

**زمان تقریبی:** 10-15 دقیقه (بسته به سرعت اینترنت و سرور)

### گام 4.3: مشاهده لاگ‌ها در حین دیپلوی

در یک ترمینال دیگر:
```bash
docker-compose logs -f
```

برای خروج: `Ctrl+C`

---

## مرحله 5️⃣: بررسی وضعیت کانتینرها

### گام 5.1: لیست کانتینرها

```bash
docker-compose ps
```

**باید 5 کانتینر ببینید:**
```
NAME                STATUS
crm_mysql           Up (healthy)
crm_nextjs          Up
crm_rabin_voice     Up
crm_phpmyadmin      Up
crm_nginx           Up
```

### گام 5.2: اگر کانتینری down است

```bash
# بررسی لاگ کانتینر مشکل‌دار
docker logs crm_mysql
docker logs crm_nextjs
docker logs crm_rabin_voice
docker logs crm_phpmyadmin
docker logs crm_nginx

# ری‌استارت کانتینر مشکل‌دار
docker-compose restart mysql
docker-compose restart nextjs
docker-compose restart rabin-voice
```

---

## مرحله 6️⃣: تست MySQL

### گام 6.1: تست اتصال به MySQL

```bash
docker exec crm_mysql mariadb -u root -e "SELECT 1;"
```

**خروجی موفق:**
```
+---+
| 1 |
+---+
| 1 |
+---+
```

### گام 6.2: بررسی دیتابیس‌ها

```bash
docker exec crm_mysql mariadb -u root -e "SHOW DATABASES;"
```

**باید ببینید:**
```
+--------------------+
| Database           |
+--------------------+
| crm_system         |
| information_schema |
| mysql              |
| performance_schema |
+--------------------+
```

### گام 6.3: بررسی جدول‌ها

```bash
docker exec crm_mysql mariadb -u root crm_system -e "SHOW TABLES;"
```

**باید جدول‌های CRM را ببینید:**
```
users
customers
deals
activities
documents
...
```

### گام 6.4: اگر جدول‌ها خالی است

```bash
# ایمپورت دستی دیتابیس
docker exec -i crm_mysql mariadb -u root crm_system < database/crm_system.sql

# بررسی مجدد
docker exec crm_mysql mariadb -u root crm_system -e "SHOW TABLES;"
```

---

## مرحله 7️⃣: تست phpMyAdmin

### گام 7.1: باز کردن phpMyAdmin

**در مرورگر:**
```
http://crm.robintejarat.com/secure-db-admin-panel-x7k9m2/
```

یا اگر SSL دارید:
```
https://crm.robintejarat.com/secure-db-admin-panel-x7k9m2/
```

### گام 7.2: ورود

- **Username:** `root`
- **Password:** (خالی - فقط Enter بزنید)

### گام 7.3: اگر خطای "Access denied" دیدید

```bash
# بررسی لاگ phpMyAdmin
docker logs crm_phpmyadmin | tail -50

# ری‌استارت MySQL و phpMyAdmin
docker-compose restart mysql phpmyadmin

# صبر کنید 30 ثانیه
sleep 30

# دوباره تست کنید
```

### گام 7.4: اگر صفحه باز نشد (404 یا 502)

```bash
# بررسی nginx
docker logs crm_nginx | tail -20

# تست مستقیم phpMyAdmin
curl -I http://localhost/secure-db-admin-panel-x7k9m2/

# ری‌استارت nginx
docker-compose restart nginx
```

---

## مرحله 8️⃣: تست Rabin Voice

### گام 8.1: تست Health Check

```bash
curl http://localhost:3001/health
```

**خروجی موفق:**
```json
{"status":"healthy","service":"rabin-voice"}
```

### گام 8.2: تست از طریق nginx

```bash
curl http://crm.robintejarat.com/rabin-voice/
```

**خروجی موفق:**
```json
{"status":"running","service":"دستیار صوتی رابین","version":"1.0.0","port":3001}
```

### گام 8.3: اگر خطا دیدید

```bash
# بررسی لاگ Rabin Voice
docker logs crm_rabin_voice | tail -50

# بررسی خطای EADDRINUSE
docker logs crm_rabin_voice 2>&1 | grep EADDRINUSE

# اگر EADDRINUSE دیدید
docker-compose restart rabin-voice

# صبر کنید 10 ثانیه
sleep 10

# دوباره تست کنید
curl http://localhost:3001/health
```

### گام 8.4: اگر هنوز کار نکرد

```bash
# متوقف کردن کانتینر
docker-compose stop rabin-voice

# حذف کانتینر
docker-compose rm -f rabin-voice

# ری‌بیلد و راه‌اندازی
docker-compose build rabin-voice
docker-compose up -d rabin-voice

# مشاهده لاگ زنده
docker logs crm_rabin_voice -f
```

---

## مرحله 9️⃣: تست NextJS (Main App)

### گام 9.1: تست Health Check

```bash
curl http://localhost:3000/api/health
```

### گام 9.2: تست صفحه اصلی

```bash
curl -I http://crm.robintejarat.com/
```

**خروجی موفق:**
```
HTTP/1.1 200 OK
```

یا:
```
HTTP/1.1 307 Temporary Redirect
```

### گام 9.3: باز کردن در مرورگر

```
http://crm.robintejarat.com/
```

یا:
```
https://crm.robintejarat.com/
```

### گام 9.4: اگر صفحه باز نشد

```bash
# بررسی لاگ NextJS
docker logs crm_nextjs | tail -50

# بررسی لاگ nginx
docker logs crm_nginx | tail -20

# ری‌استارت
docker-compose restart nextjs nginx

# صبر کنید 30 ثانیه
sleep 30

# دوباره تست کنید
```

---

## مرحله 🔟: تست کامل سیستم

### گام 10.1: اجرای اسکریپت تست

```bash
bash quick-test.sh
```

### گام 10.2: تست دستی همه endpoints

```bash
# Main App
curl -I http://crm.robintejarat.com/

# API
curl -I http://crm.robintejarat.com/api/health

# Rabin Voice
curl http://crm.robintejarat.com/rabin-voice/health

# phpMyAdmin
curl -I http://crm.robintejarat.com/secure-db-admin-panel-x7k9m2/
```

---

## مرحله 1️⃣1️⃣: مانیتورینگ و لاگ‌ها

### گام 11.1: مشاهده لاگ‌های زنده همه سرویس‌ها

```bash
docker-compose logs -f
```

### گام 11.2: مشاهده لاگ یک سرویس خاص

```bash
# MySQL
docker logs crm_mysql -f

# NextJS
docker logs crm_nextjs -f

# Rabin Voice
docker logs crm_rabin_voice -f

# phpMyAdmin
docker logs crm_phpmyadmin -f

# Nginx
docker logs crm_nginx -f
```

### گام 11.3: بررسی استفاده از منابع

```bash
docker stats
```

**خروجی:**
```
CONTAINER         CPU %     MEM USAGE / LIMIT
crm_mysql         2.5%      256MB / 1GB
crm_nextjs        5.0%      512MB / 1GB
crm_rabin_voice   1.0%      256MB / 512MB
crm_phpmyadmin    0.5%      128MB / 256MB
crm_nginx         0.2%      64MB / 128MB
```

---

## مرحله 1️⃣2️⃣: تست عملکرد

### گام 12.1: ورود به سیستم

1. باز کنید: `http://crm.robintejarat.com/`
2. صفحه ورود باید نمایش داده شود
3. اگر کاربر ندارید، از phpMyAdmin یک کاربر بسازید

### گام 12.2: تست Rabin Voice در مرورگر

1. باز کنید: `http://crm.robintejarat.com/rabin-voice/`
2. باید صفحه دستیار صوتی نمایش داده شود
3. اگر API Key تنظیم کرده‌اید، تست کنید

### گام 12.3: تست آپلود فایل

1. وارد سیستم شوید
2. به بخش Documents بروید
3. یک فایل آپلود کنید
4. بررسی کنید که فایل ذخیره شد

---

## 🐛 عیب‌یابی رایج

### مشکل 1: Access denied for user 'crm_app_user'

**علت:** تنظیمات قدیمی هنوز در .env است

**راه حل:**
```bash
# اصلاح .env
sed -i 's|DATABASE_USER=.*|DATABASE_USER=root|g' .env
sed -i 's|DATABASE_PASSWORD=.*|DATABASE_PASSWORD=|g' .env

# اصلاح صدای رابین/.env
sed -i 's|DATABASE_USER=.*|DATABASE_USER=root|g' "صدای رابین/.env"
sed -i 's|DATABASE_PASSWORD=.*|DATABASE_PASSWORD=|g' "صدای رابین/.env"

# ری‌استارت
docker-compose restart
```

### مشکل 2: EADDRINUSE: port 3001

**علت:** پورت 3001 قبلاً استفاده شده

**راه حل:**
```bash
# ری‌استارت Rabin Voice
docker-compose restart rabin-voice

# اگر کار نکرد
docker-compose stop rabin-voice
docker-compose rm -f rabin-voice
docker-compose up -d rabin-voice
```

### مشکل 3: phpMyAdmin نمی‌تواند وصل شود

**علت:** MySQL هنوز آماده نیست یا تنظیمات اشتباه است

**راه حل:**
```bash
# تست MySQL
docker exec crm_mysql mariadb -u root -e "SELECT 1;"

# اگر خطا داد
docker-compose restart mysql

# صبر کنید 30 ثانیه
sleep 30

# ری‌استارت phpMyAdmin
docker-compose restart phpmyadmin
```

### مشکل 4: Rabin Voice 502 Bad Gateway

**علت:** Rabin Voice هنوز بالا نیامده یا crash کرده

**راه حل:**
```bash
# بررسی لاگ
docker logs crm_rabin_voice | tail -50

# بررسی وضعیت
docker ps | grep rabin

# اگر down است
docker-compose up -d rabin-voice

# مشاهده لاگ زنده
docker logs crm_rabin_voice -f
```

### مشکل 5: NextJS صفحه سفید نمایش می‌دهد

**علت:** Build ناموفق یا خطای JavaScript

**راه حل:**
```bash
# بررسی لاگ
docker logs crm_nextjs | tail -100

# ری‌بیلد
docker-compose build nextjs
docker-compose up -d nextjs

# مشاهده لاگ
docker logs crm_nextjs -f
```

### مشکل 6: nginx 502 Bad Gateway

**علت:** سرویس backend (nextjs یا rabin-voice) down است

**راه حل:**
```bash
# بررسی همه سرویس‌ها
docker-compose ps

# ری‌استارت همه
docker-compose restart

# بررسی nginx config
docker exec crm_nginx nginx -t

# اگر خطا داد
docker-compose restart nginx
```

---

## 🔄 دستورات مفید

### ری‌استارت همه سرویس‌ها
```bash
docker-compose restart
```

### ری‌استارت یک سرویس
```bash
docker-compose restart mysql
docker-compose restart nextjs
docker-compose restart rabin-voice
```

### متوقف کردن همه
```bash
docker-compose down
```

### راه‌اندازی مجدد
```bash
docker-compose up -d
```

### ری‌بیلد و راه‌اندازی
```bash
docker-compose build
docker-compose up -d
```

### پاکسازی کامل و شروع مجدد
```bash
docker-compose down
docker system prune -af
bash deploy-server.sh --clean
```

### بک‌آپ دیتابیس
```bash
docker exec crm_mysql mariadb-dump -u root crm_system > backup_$(date +%Y%m%d_%H%M%S).sql
```

### ریستور دیتابیس
```bash
docker exec -i crm_mysql mariadb -u root crm_system < backup_20251020_123456.sql
```

---

## ✅ Checklist نهایی

پس از دیپلوی، این‌ها را بررسی کنید:

- [ ] `docker-compose ps` - همه 5 کانتینر Up هستند
- [ ] `docker exec crm_mysql mariadb -u root -e "SELECT 1;"` - موفق
- [ ] `curl http://localhost:3001/health` - موفق
- [ ] `curl http://localhost:3000/api/health` - موفق
- [ ] phpMyAdmin با root بدون پسورد باز می‌شود
- [ ] Main app در مرورگر باز می‌شود
- [ ] Rabin Voice در مرورگر باز می‌شود
- [ ] هیچ خطای EADDRINUSE در لاگ‌ها نیست
- [ ] هیچ خطای Access denied نیست

---

## 🎉 موفقیت!

اگر همه checklist‌ها ✅ هستند، سیستم شما با موفقیت دیپلوی شده است!

**آدرس‌های دسترسی:**
- 🌐 Main App: `http://crm.robintejarat.com/`
- 🎤 Rabin Voice: `http://crm.robintejarat.com/rabin-voice/`
- 🔐 phpMyAdmin: `http://crm.robintejarat.com/secure-db-admin-panel-x7k9m2/`

**اطلاعات ورود phpMyAdmin:**
- Username: `root`
- Password: (خالی)

---

## 📞 پشتیبانی

اگر مشکلی پیش آمد:
1. لاگ‌ها را بررسی کنید: `docker-compose logs -f`
2. اسکریپت بررسی را اجرا کنید: `bash verify-all-configs.sh`
3. به بخش عیب‌یابی مراجعه کنید
4. اگر حل نشد، لاگ‌ها را ذخیره کنید و به تیم پشتیبانی ارسال کنید
