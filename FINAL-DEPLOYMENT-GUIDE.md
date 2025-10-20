# 🚀 راهنمای نهایی دیپلوی - CRM System

## 📋 خلاصه تغییرات

### ✅ تغییرات اصلی

1. **MySQL بدون پسورد**: همه سرویس‌ها با `root` بدون پسورد به MySQL متصل می‌شوند
2. **Rabin Voice ساده‌سازی شد**: فقط Express API (بدون Next.js)
3. **مشکل EADDRINUSE حل شد**: پورت 3001 قبل از شروع پاک می‌شود
4. **phpMyAdmin راحت**: با `root` بدون پسورد وارد شوید

---

## 🏗️ معماری سیستم

```
┌─────────────────────────────────────────────────────┐
│              Nginx (Port 80/443)                    │
│  ┌──────────────────────────────────────────────┐   │
│  │ /                    → NextJS:3000           │   │
│  │ /rabin-voice/        → Rabin Voice:3001      │   │
│  │ /secure-db-admin...  → phpMyAdmin:80         │   │
│  │ /api/                → NextJS:3000           │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────┼───────────────┐
        │               │               │
    ┌───▼────┐    ┌────▼─────┐    ┌───▼────────┐
    │ NextJS │    │  MySQL   │    │   Rabin    │
    │ :3000  │    │  :3306   │    │   Voice    │
    │        │    │          │    │   :3001    │
    │        │    │ root/    │    │ (Express)  │
    │        │    │ no pass  │    │            │
    └────────┘    └──────────┘    └────────────┘
                       │
                  ┌────▼────────┐
                  │ phpMyAdmin  │
                  │    :80      │
                  │ root/no pass│
                  └─────────────┘
```

---

## 📁 فایل‌های اصلاح شده

### 1. docker-compose.yml
```yaml
# MySQL
MYSQL_ALLOW_EMPTY_PASSWORD: "yes"
MYSQL_ROOT_PASSWORD: ""
command: --skip-grant-tables

# NextJS
DATABASE_USER: root
DATABASE_PASSWORD: ""

# Rabin Voice
DATABASE_USER: root
DATABASE_PASSWORD: ""

# phpMyAdmin
PMA_USER: root
PMA_PASSWORD: ""
```

### 2. Dockerfile (Main NextJS)
- ✅ Build standalone
- ✅ Upload directories با permissions درست
- ✅ Root بدون پسورد برای database

### 3. صدای رابین/Dockerfile
```dockerfile
# ✅ فقط Express API - بدون Next.js
# ✅ کپی فقط api/ و node_modules
# ✅ بدون .next directory
```

### 4. صدای رابین/start.sh
```bash
# ✅ Kill پورت 3001 قبل از شروع
# ✅ فقط Express API (بدون Next.js)
# ✅ Wait برای API process
```

### 5. lib/database.ts
```typescript
const dbConfig = {
  user: 'root',
  password: '',
  // ...
};
```

### 6. صدای رابین/api/services/database.js
```javascript
const getDBConfig = () => {
    return {
        user: "root",
        password: "",
        // ...
    };
};
```

### 7. nginx/default.conf
```nginx
# Rabin Voice - فقط Express API
location /rabin-voice/ {
    proxy_pass http://rabin-voice:3001/;
    # ...
}
```

### 8. nginx/simple.conf
```nginx
# Rabin Voice اضافه شد
location /rabin-voice/ {
    proxy_pass http://rabin-voice:3001/;
    # ...
}
```

### 9. database/init.sql
```sql
-- ساده شد - فقط CREATE DATABASE
CREATE DATABASE IF NOT EXISTS `crm_system`;
USE `crm_system`;
```

### 10. setup-all-env.sh
```bash
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_URL=mysql://root@mysql:3306/crm_system
```

### 11. deploy-server.sh
```bash
# init.sql ساده شد
# بدون user creation
# بدون password
```

---

## 🚀 دستورات دیپلوی

### دیپلوی کامل (اولین بار):
```bash
# 1. تنظیم .env files
bash setup-all-env.sh

# 2. دیپلوی
bash deploy-server.sh
```

### دیپلوی با پاکسازی کامل:
```bash
bash deploy-server.sh --clean
```

### ری‌استارت سرویس خاص:
```bash
docker-compose restart rabin-voice
docker-compose restart nextjs
docker-compose restart mysql
```

---

## 🔍 تست و بررسی

### 1. تست MySQL:
```bash
# اتصال به MySQL
docker exec -it crm_mysql mariadb -u root

# نمایش دیتابیس‌ها
docker exec crm_mysql mariadb -u root -e "SHOW DATABASES;"

# تست جدول‌ها
docker exec crm_mysql mariadb -u root crm_system -e "SHOW TABLES;"
```

### 2. تست Rabin Voice:
```bash
# Health check
curl http://localhost:3001/health

# از طریق nginx
curl http://crm.robintejarat.com/rabin-voice/

# بررسی لاگ
docker logs crm_rabin_voice -f
```

### 3. تست NextJS:
```bash
# Health check
curl http://localhost:3000/api/health

# از طریق nginx
curl http://crm.robintejarat.com/

# بررسی لاگ
docker logs crm_nextjs -f
```

### 4. تست phpMyAdmin:
```bash
# دسترسی مستقیم
curl -I http://localhost/secure-db-admin-panel-x7k9m2/

# از طریق دامنه
curl -I http://crm.robintejarat.com/secure-db-admin-panel-x7k9m2/
```

---

## 🔐 دسترسی به سرویس‌ها

### phpMyAdmin:
- **URL**: `https://crm.robintejarat.com/secure-db-admin-panel-x7k9m2/`
- **Username**: `root`
- **Password**: (خالی - فقط Enter بزنید)

### Rabin Voice:
- **URL**: `https://crm.robintejarat.com/rabin-voice/`
- **Health**: `https://crm.robintejarat.com/rabin-voice/health`

### Main App:
- **URL**: `https://crm.robintejarat.com/`
- **API**: `https://crm.robintejarat.com/api/`

---

## 🐛 عیب‌یابی

### مشکل: Access denied for user
```bash
# بررسی .env
cat .env | grep DATABASE

# باید باشد:
# DATABASE_USER=root
# DATABASE_PASSWORD=

# اصلاح
sed -i 's|DATABASE_USER=.*|DATABASE_USER=root|g' .env
sed -i 's|DATABASE_PASSWORD=.*|DATABASE_PASSWORD=|g' .env
```

### مشکل: EADDRINUSE port 3001
```bash
# بررسی لاگ
docker logs crm_rabin_voice 2>&1 | tail -50

# ری‌استارت
docker-compose restart rabin-voice

# اگر مشکل ادامه داشت
docker-compose down
docker-compose up -d
```

### مشکل: phpMyAdmin نمی‌تواند وصل شود
```bash
# بررسی MySQL
docker exec crm_mysql mariadb -u root -e "SELECT 1;"

# بررسی phpMyAdmin logs
docker logs crm_phpmyadmin

# ری‌استارت
docker-compose restart phpmyadmin
```

### مشکل: Rabin Voice 502 Bad Gateway
```bash
# بررسی که container بالا است
docker ps | grep rabin

# بررسی لاگ
docker logs crm_rabin_voice -f

# تست مستقیم
docker exec crm_rabin_voice wget -O- http://localhost:3001/health

# ری‌بیلد
docker-compose build rabin-voice
docker-compose up -d rabin-voice
```

---

## 📊 بررسی وضعیت

### همه کانتینرها:
```bash
docker-compose ps
```

### لاگ‌های زنده:
```bash
# همه سرویس‌ها
docker-compose logs -f

# یک سرویس خاص
docker-compose logs -f rabin-voice
docker-compose logs -f nextjs
docker-compose logs -f mysql
```

### استفاده از منابع:
```bash
docker stats
```

---

## ⚠️ نکات مهم

### 1. امنیت
- ⚠️ این تنظیمات برای محیط توسعه است
- ⚠️ در production باید پسورد قوی تنظیم شود
- ⚠️ phpMyAdmin را در production غیرفعال کنید یا IP محدود کنید

### 2. Backup
```bash
# Backup دیتابیس
docker exec crm_mysql mariadb-dump -u root crm_system > backup_$(date +%Y%m%d).sql

# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

### 3. Container Names
- `crm_mysql` - MySQL Database
- `crm_nextjs` - Main NextJS App
- `crm_rabin_voice` - Rabin Voice Assistant
- `crm_phpmyadmin` - phpMyAdmin
- `crm_nginx` - Nginx Reverse Proxy

### 4. Ports
- `80` - HTTP (Nginx)
- `443` - HTTPS (Nginx)
- `3000` - NextJS (internal)
- `3001` - Rabin Voice (internal)
- `3306` - MySQL (exposed)

---

## ✅ Checklist نهایی

قبل از دیپلوی:
- [ ] `.env` موجود است و `DATABASE_USER=root`
- [ ] `صدای رابین/.env` موجود است
- [ ] `database/init.sql` ساده است (بدون user creation)
- [ ] `docker-compose.yml` با `MYSQL_ALLOW_EMPTY_PASSWORD=yes`
- [ ] `nginx/default.conf` یا `nginx/simple.conf` Rabin Voice دارد

بعد از دیپلوی:
- [ ] همه 5 کانتینر بالا هستند
- [ ] MySQL با `root` بدون پسورد کار می‌کند
- [ ] phpMyAdmin باز می‌شود
- [ ] Rabin Voice `/rabin-voice/health` پاسخ می‌دهد
- [ ] Main app باز می‌شود
- [ ] هیچ خطای EADDRINUSE نیست

---

## 🎉 موفقیت!

اگر همه چک‌لیست‌ها ✅ هستند، سیستم شما آماده است!

```bash
echo "🎉 دیپلوی موفق!"
echo "🌐 Main App: https://crm.robintejarat.com"
echo "🎤 Rabin Voice: https://crm.robintejarat.com/rabin-voice/"
echo "🔐 phpMyAdmin: https://crm.robintejarat.com/secure-db-admin-panel-x7k9m2/"
```
