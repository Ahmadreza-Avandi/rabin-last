# 🚀 دستورالعمل‌های Deployment

## ✅ متطلبات پیش‌نیاز

- Docker و Docker Compose نصب شده باشند
- 2GB+ RAM (بهتر 4GB)
- ۲۰ GB فضای free disk

---

## 📋 مراحل Deployment

### **مرحله 1: Setup ENV Files** (یک‌بار اول)
```bash
bash setup-all-env.sh
```

**این اسکریپت انجام می‌دهد:**
- ✅ `.env` را در root ایجاد می‌کند
- ✅ `صدای رابین/.env` را ایجاد می‌کند  
- ✅ تمام متغیرهای محیطی را تنظیم می‌کند
- ✅ Database password را تنظیم می‌کند
- ✅ درخواست OpenRouter API Key

**نکات:**
- اگر `.env` از قبل موجود است، backup ایجاد می‌کند
- DATABASE_PASSWORD = `1234` (default)
- اگر می‌خواهید password تغییر کند:
  ```bash
  export DB_PASSWORD="your_strong_password"
  bash setup-all-env.sh
  ```

---

### **مرحله 2: Deploy Server**
```bash
bash deploy-server.sh
```

**این اسکریپت انجام می‌دهد:**
- ✅ بررسی سیستم (RAM، Swap)
- ✅ ایجاد دایرکتوری‌های مورد نیاز
- ✅ آماده‌سازی Database files
- ✅ تنظیم `.env` (اگر نیاز باشد)
- ✅ تنظیم `صدای رابین/.env`
- ✅ Build Docker containers
- ✅ راه‌اندازی سرویس‌ها

---

### **مرحله 3: Rebuild (پاکسازی کامل)**
اگر مشکلی پیش آمد، rebuild با پاکسازی:
```bash
bash deploy-server.sh --clean
# یا
bash deploy-server.sh -c
```

---

## 🔑 متغیرهای محیطی مهم

### `.env` (Root - ریشه پروژه)
```env
DATABASE_PASSWORD=1234
DATABASE_USER=crm_app_user
DATABASE_NAME=crm_system
NODE_ENV=production
JWT_SECRET=...
NEXTAUTH_SECRET=...
```

### `صدای رابین/.env` (Rabin Voice)
```env
DATABASE_HOST=mysql
DATABASE_PASSWORD=1234
DATABASE_USER=crm_app_user
DATABASE_NAME=crm_system
OPENROUTER_API_KEY=sk-or-v1-...
```

---

## 🧪 بررسی بعد از Deploy

### بررسی Containers
```bash
# دیدن تمام containers
docker ps

# بررسی logs
docker-compose logs -f
```

### بررسی Services
```bash
# بررسی Rabin Voice API
curl http://localhost:3001/rabin-voice

# بررسی NextJS CRM
curl http://localhost:3000

# بررسی MySQL
docker exec crm-mysql mysql -u root -p1234 -e "SELECT 1"
```

### بررسی Database
```bash
# اتصال به phpMyAdmin
# URL: http://yourdomain/secure-db-admin-panel-x7k9m2/
# User: crm_app_user
# Password: (از .env)
```

---

## ❌ حل مشکلات عام

### "Permission Denied" برای Logs
```bash
chmod -R 777 صدای\ رابین/logs
chmod -R 777 logs
docker-compose restart
```

### "Access Denied" برای MySQL
```bash
# بررسی متغیرهای محیطی
cat .env | grep DATABASE

# بررسی password صحیح است
docker-compose restart mysql
```

### Rabin Voice API Not Responding
```bash
# بررسی logs
docker logs crm-rabin-voice

# بررسی فایل .env
docker exec crm-rabin-voice env | grep DATABASE

# restart
docker-compose restart rabin-voice
```

### NextJS CRM Not Starting
```bash
# بررسی موارد
docker logs crm-nextjs

# بررسی Database connection
docker-compose exec nextjs node -e "console.log(process.env.DATABASE_URL)"

# rebuild
docker-compose build --no-cache nextjs
docker-compose restart nextjs
```

---

## 📊 Process List بعد از Deploy موفق

```bash
$ docker ps

NAME                  STATUS              PORTS
crm-mysql            Up (healthy)        3306/tcp
crm-rabin-voice      Up (healthy)        3001/tcp
crm-nextjs           Up (healthy)        3000/tcp
crm-phpmyadmin       Up                  80/tcp
crm-nginx            Up                  443/tcp, 80/tcp
```

---

## 🔐 نکات امنیتی

- ✅ `.env` را در version control commit نکنید
- ✅ DATABASE_PASSWORD را قوی کنید:
  ```bash
  export DB_PASSWORD="MyStrongPass@2024#Secure"
  bash setup-all-env.sh
  bash deploy-server.sh
  ```
- ✅ OPENROUTER_API_KEY را در `صدای رابین/.env` تنظیم کنید
- ✅ phpMyAdmin فقط از trusted IPs قابل دسترس باشد

---

## 📝 Quick Reference

| دستور | توضیح |
|------|-------|
| `bash setup-all-env.sh` | Setup اولیه ENV |
| `bash deploy-server.sh` | Deploy عادی |
| `bash deploy-server.sh --clean` | Deploy با پاکسازی |
| `docker-compose logs -f` | بررسی logs |
| `docker-compose restart` | Restart تمام services |
| `docker-compose down` | بند کردن تمام services |

---

## ✨ نتیجه نهایی

اگر مراحل بالا رو دنبال کردید:
- ✅ Database authenticated است
- ✅ Rabin Voice API درست کار می‌کند
- ✅ NextJS CRM available است
- ✅ تمام logs قابل نوشتن هستند
- ✅ Environment variables synchronized هستند