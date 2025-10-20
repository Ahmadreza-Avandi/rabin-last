# 🚀 راهنمای سریع دیپلوی

## ✅ تغییرات اعمال شده

### 1. MySQL بدون پسورد
- همه سرویس‌ها با `root` بدون پسورد به MySQL متصل می‌شوند
- phpMyAdmin با `root` بدون پسورد کار می‌کند

### 2. Rabin Voice ساده‌سازی
- فقط Express API روی پورت 3001
- Next.js از Rabin Voice حذف شد
- مشکل EADDRINUSE حل شد

### 3. فایل‌های اصلاح شده
- ✅ `docker-compose.yml` - MySQL بدون پسورد
- ✅ `lib/database.ts` - root بدون پسورد
- ✅ `صدای رابین/Dockerfile` - فقط Express API
- ✅ `صدای رابین/start.sh` - Kill پورت 3001
- ✅ `صدای رابین/api/services/database.js` - root بدون پسورد
- ✅ `nginx/default.conf` - Rabin Voice location
- ✅ `nginx/simple.conf` - Rabin Voice location
- ✅ `setup-all-env.sh` - root بدون پسورد
- ✅ `deploy-server.sh` - init.sql ساده

---

## 🚀 دستورات دیپلوی

### گام 1: بررسی تنظیمات
```bash
bash verify-all-configs.sh
```

### گام 2: تنظیم .env (اگر نیاز است)
```bash
bash setup-all-env.sh
```

### گام 3: دیپلوی
```bash
# دیپلوی معمولی
bash deploy-server.sh

# یا دیپلوی با پاکسازی کامل
bash deploy-server.sh --clean
```

---

## 🔍 تست سریع

### بررسی کانتینرها:
```bash
docker-compose ps
```

### تست MySQL:
```bash
docker exec crm_mysql mariadb -u root -e "SHOW DATABASES;"
```

### تست Rabin Voice:
```bash
curl http://localhost:3001/health
```

### تست phpMyAdmin:
```bash
# مرورگر
https://crm.robintejarat.com/secure-db-admin-panel-x7k9m2/
# Username: root
# Password: (خالی)
```

---

## 📋 Container Names

- `crm_mysql` - MySQL Database
- `crm_nextjs` - Main NextJS App  
- `crm_rabin_voice` - Rabin Voice Assistant
- `crm_phpmyadmin` - phpMyAdmin
- `crm_nginx` - Nginx Reverse Proxy

---

## 🐛 عیب‌یابی سریع

### مشکل: Access denied
```bash
# اصلاح .env
sed -i 's|DATABASE_USER=.*|DATABASE_USER=root|g' .env
sed -i 's|DATABASE_PASSWORD=.*|DATABASE_PASSWORD=|g' .env
docker-compose restart
```

### مشکل: EADDRINUSE
```bash
docker-compose restart rabin-voice
```

### مشکل: phpMyAdmin نمی‌تواند وصل شود
```bash
docker-compose restart phpmyadmin mysql
```

---

## 📚 اسناد کامل

- `FINAL-DEPLOYMENT-GUIDE.md` - راهنمای کامل دیپلوی
- `MYSQL-NO-PASSWORD-CHANGES.md` - جزئیات تغییرات MySQL
- `verify-all-configs.sh` - اسکریپت بررسی تنظیمات

---

## ✅ Checklist

- [ ] `verify-all-configs.sh` بدون خطا اجرا شد
- [ ] همه 5 کانتینر بالا هستند
- [ ] MySQL با root بدون پسورد کار می‌کند
- [ ] phpMyAdmin باز می‌شود
- [ ] Rabin Voice health check پاسخ می‌دهد
- [ ] Main app باز می‌شود

---

## 🎉 موفقیت!

```
🌐 Main App: https://crm.robintejarat.com
🎤 Rabin Voice: https://crm.robintejarat.com/rabin-voice/
🔐 phpMyAdmin: https://crm.robintejarat.com/secure-db-admin-panel-x7k9m2/
```
