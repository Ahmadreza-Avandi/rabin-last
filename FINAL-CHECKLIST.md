# ✅ چک‌لیست نهایی قبل از دیپلوی

## 🔍 فایل‌های بررسی شده:

### ✅ docker-compose.yml
- [x] MySQL password از متغیر استفاده می‌کند
- [x] phpMyAdmin password یکسان است
- [x] Rabin Voice healthcheck درست است
- [x] همه سرویس‌ها در یک network هستند
- [x] Dependencies درست تنظیم شده

### ✅ database/init.sql
- [x] Docker network pattern (172.%.%.%) اضافه شده
- [x] DROP USER برای همه patterns
- [x] CREATE USER برای همه patterns
- [x] GRANT برای همه patterns
- [x] FLUSH PRIVILEGES

### ✅ nginx/default.conf
- [x] DNS resolver با ipv6=off
- [x] Rabin Voice با trailing slash و variable
- [x] SSL configuration
- [x] Security headers
- [x] Proxy settings

### ✅ صدای رابین/Dockerfile
- [x] Multi-stage build
- [x] node_modules از deps stage
- [x] API directory کپی می‌شود
- [x] Permissions درست
- [x] USER nextjs (امنیت)

### ✅ صدای رابین/.env
- [x] OpenRouter API Key تنظیم شده
- [x] Database password یکسان
- [x] همه متغیرها موجود

### ✅ .env (root)
- [x] Database password: 1234
- [x] JWT secrets تولید شده
- [x] Email configuration

---

## 🚀 دستورات دیپلوی:

### روی لوکال (ویندوز):
```powershell
npm run fix-before-deploy
```

### آپلود به سرور
```bash
# با git
git add .
git commit -m "Ready for deployment"
git push

# یا با scp/ftp
```

### روی سرور (لینوکس):
```bash
# تنظیم ENV ها
bash setup-all-env.sh

# دیپلوی
bash deploy-server.sh
```

---

## ⚠️ نکات مهم:

1. **پسورد دیتابیس**: همه جا `1234` است (برای production تغییر دهید)
2. **OpenRouter API Key**: در `صدای رابین/.env` تنظیم شده
3. **SSL**: اگر SSL نداشتید، سیستم با HTTP کار می‌کند
4. **حافظه**: سرور کم حافظه swap می‌سازد

---

## 🎯 انتظارات بعد از دیپلوی:

✅ MySQL بالا می‌آید و user ها ساخته می‌شوند
✅ Rabin Voice با express module کار می‌کند
✅ nginx به rabin-voice متصل می‌شود
✅ phpMyAdmin کار می‌کند
✅ NextJS CRM کار می‌کند

---

## 🔧 اگر مشکلی پیش آمد:

```bash
# لاگ‌ها را بررسی کنید
docker logs crm_mysql
docker logs crm_rabin_voice
docker logs crm_nextjs
docker logs crm_nginx

# یا همه با هم
docker-compose logs -f
```

---

✅ **همه چیز آماده است!**
