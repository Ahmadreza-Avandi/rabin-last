# ✅ Deployment Checklist

## مرحله اول: Setup ENV
```bash
bash setup-all-env.sh
```

- [ ] .env ایجاد شد
- [ ] صدای رابین/.env ایجاد شد
- [ ] DATABASE_PASSWORD=1234 تنظیم شد
- [ ] Permissions تنظیم شدند

**بررسی:**
```bash
cat .env | grep DATABASE_PASSWORD
cat صدای\ رابین/.env | grep DATABASE_PASSWORD
# باید هردو نشان 1234 بدهند
```

---

## مرحله دوم: Deploy
```bash
bash deploy-server.sh
```

- [ ] Swap تنظیم شد (اگر RAM < 2GB)
- [ ] Database init.sql ایجاد شد
- [ ] صدای رابین/.env آپدیت شد
- [ ] Docker images built شدند
- [ ] Containers running هستند

**بررسی:**
```bash
docker ps
# باید 5 containers دیده شوند:
# - crm-mysql
# - crm-rabin-voice
# - crm-nextjs
# - crm-phpmyadmin
# - crm-nginx
```

---

## مرحله سوم: Verify Services

### ✅ MySQL
```bash
docker exec crm-mysql mysql -u crm_app_user -p1234 -e "SELECT 1"
```
- [ ] Response: Query OK

### ✅ Rabin Voice API
```bash
curl http://localhost:3001/rabin-voice
```
- [ ] Response: `{"status":"running"}`

### ✅ NextJS CRM
```bash
curl http://localhost:3000
```
- [ ] Response: HTML content

### ✅ phpMyAdmin
```bash
curl -s http://localhost/secure-db-admin-panel-x7k9m2/ | head
```
- [ ] Response: HTML (not 404)

---

## مرحله چهارم: Database Verification

```bash
docker exec crm-mysql mysql -u root -p1234 crm_system -e "SHOW TABLES;"
```

- [ ] جداول دیتابیس نشان داده شدند
- [ ] حداقل این جداول باید موجود باشند:
  - [ ] customers
  - [ ] contacts
  - [ ] users
  - [ ] permissions

---

## مرحله پنجم: Logs Check

### Rabin Voice Logs
```bash
docker logs crm-rabin-voice
```
- [ ] هیچ "Permission denied" نیست
- [ ] هیچ "Cannot connect to mysql" نیست
- [ ] Port 3001 listening است

### NextJS Logs
```bash
docker logs crm-nextjs
```
- [ ] Build successful است
- [ ] Server started است
- [ ] Database connections OK است

### MySQL Logs
```bash
docker logs crm-mysql
```
- [ ] سروسی آماده است
- [ ] هیچ error نیست

---

## مرحله ششم: Environment Variables

```bash
# در Rabin Voice Container
docker exec crm-rabin-voice env | grep DATABASE
# باید نشان دهد:
# - DATABASE_HOST=mysql
# - DATABASE_USER=crm_app_user
# - DATABASE_PASSWORD=1234
# - DATABASE_NAME=crm_system

# در NextJS Container
docker exec crm-nextjs env | grep DATABASE_PASSWORD
# باید نشان دهد:
# - DATABASE_PASSWORD=1234
```

- [ ] DATABASE_PASSWORD یکسان است در تمام جاها
- [ ] DATABASE_HOST=mysql است
- [ ] DATABASE_USER=crm_app_user است

---

## مرحله هفتم: File Permissions

```bash
ls -la صدای\ رابین/logs/
ls -la logs/
```

- [ ] صدای رابین/logs دارای write permission است (755 یا 777)
- [ ] logs دارای write permission است

```bash
touch صدای\ رابین/logs/test.txt
touch logs/test.txt
rm صدای\ رابین/logs/test.txt logs/test.txt
```

- [ ] هیچ "Permission denied" نیست

---

## مرحله هشتم: Health Checks

```bash
# Rabin Voice health
docker-compose ps | grep rabin-voice
# باید نشان دهد: "Up (health: starting)" یا "Up (healthy)"

# MySQL health
docker-compose ps | grep mysql
# باید نشان دهد: "Up (health: starting)" یا "Up (healthy)"
```

- [ ] تمام health checks "healthy" هستند
- [ ] wait کنید 60 ثانیه برای rabin-voice و 30 ثانیه برای mysql

---

## مرحله نهم: Database Connection Test

```bash
docker exec crm-nextjs node -e "
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'mysql',
  user: 'crm_app_user',
  password: '1234',
  database: 'crm_system'
});
pool.getConnection().then(conn => {
  console.log('✅ Connected');
  conn.release();
  process.exit(0);
}).catch(err => {
  console.log('❌ Error:', err.message);
  process.exit(1);
});
"
```

- [ ] Response: "✅ Connected"

---

## مرحله دهم: API Test

```bash
# Rabin Voice Database Query
curl -s http://localhost:3001/health

# NextJS API
curl -s http://localhost:3000/api/auth/status
```

- [ ] Rabin Voice responds
- [ ] NextJS responds

---

## ⚠️ اگر مشکلی بود

### مشکل: "Access denied for user 'crm_app_user'"
```bash
# حل:
docker-compose down
docker volume rm $(docker volume ls -q | grep mysql)
bash deploy-server.sh --clean
```

### مشکل: "Permission denied" در logs
```bash
# حل:
chmod -R 777 صدای\ رابین/logs
chmod -R 777 logs
docker-compose restart rabin-voice
```

### مشکل: Rabin Voice not responding
```bash
# حل:
docker logs crm-rabin-voice
# اگر DATABASE_PASSWORD error است:
docker exec crm-rabin-voice cat /app/.env | grep DATABASE_PASSWORD
# اگر نیست یا غلط است:
bash deploy-server.sh
```

---

## ✨ نتیجه نهایی

اگر تمام checkmarks ✅ قرار گرفتند:
- ✅ System fully deployed است
- ✅ Database synced است
- ✅ Rabin Voice working است
- ✅ CRM accessible است
- ✅ Ready برای production

**Date Completed:** _______________

**Status:** _______________