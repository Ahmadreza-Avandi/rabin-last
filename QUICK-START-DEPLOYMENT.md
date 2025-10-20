# 🚀 Quick Start - Deployment

## 📍 خلاصه سریع

```bash
# بر روی سرور (SSH اتصال)
ssh root@crm.robintejarat.com
cd /root/crm  # یا جایی که project قرار دارد

# ✅ فقط **یکبار** اول deployment:
bash setup-all-env.sh

# ✅ برای deploy/rebuild:
bash deploy-server.sh

# ✅ برای تست:
bash test-deployment.sh
```

---

## 🎯 اسکریپت‌های موجود

| اسکریپت | زمان | هدف | اجرا |
|--------|------|-----|-----|
| `setup-all-env.sh` | 5 دقیقه | تنظیم ENV variables | **فقط یک‌بار** |
| `deploy-server.sh` | 10 دقیقه | Build و run Docker | هر rebuild |
| `test-deployment.sh` | 2 دقیقه | تست تمام سرویس‌ها | بعد از deploy |
| `test-rabin-voice-build.sh` | 5 دقیقه | فقط تست Rabin Voice build | Optional |

---

## 🔧 Deployment Steps

### Step 1️⃣: اول بار - Setup
```bash
# در ریشه project:
bash setup-all-env.sh

# نتایج:
# ✅ .env ایجاد
# ✅ صدای رابین/.env ایجاد
# ✅ Database password sync شد
```

### Step 2️⃣: Deploy Containers
```bash
bash deploy-server.sh

# نتایج:
# ✅ Containers built
# ✅ MySQL imported
# ✅ Services running
```

**اگر timeout شد:**
```bash
bash deploy-server.sh --clean
```

### Step 3️⃣: Test Everything
```bash
bash test-deployment.sh

# نتایج:
# 📊 تمام services: ✅ Running
# 📊 Database: ✅ Connected
# 📊 API: ✅ Responding
# 📊 Domain: ✅ Working
```

---

## 🌍 Access بعد از Deployment

```
🌐 Main CRM:           https://crm.robintejarat.com
🎤 Rabin Voice:        https://crm.robintejarat.com/rabin-voice
🗄️ PhpMyAdmin:         https://crm.robintejarat.com/phpmyadmin
⚡ API Health:         https://crm.robintejarat.com/api/health
```

---

## 🆘 Troubleshooting Quick Fixes

### ❌ MySQL Connection Error
```bash
# بررسی container
docker ps | grep mysql

# بررسی logs
docker logs crm-mysql | tail -20

# تست connection
docker exec crm-mysql mysql -u root -p$DATABASE_PASSWORD -e "SHOW DATABASES;"
```

### ❌ Rabin Voice 502 Error
```bash
# بررسی logs
docker logs crm-rabin-voice | tail -50

# بررسی database
docker exec crm-rabin-voice curl http://localhost:3001/rabin-voice/api/database?action=test-connection

# بررسی PASSWORD sync
diff <(grep DATABASE_PASSWORD .env) <(grep DATABASE_PASSWORD صدای\ رابین/.env)
```

### ❌ Containers Not Starting
```bash
# فقط restart
docker-compose restart

# اگر نشد:
docker-compose down
bash deploy-server.sh --clean
```

### ❌ Build Failures
```bash
# بررسی logs
docker-compose logs --tail=100

# اگر memory issue است:
# سرور یکی از اینها کن:
# 1. RAM بیشتری داشته باشد
# 2. یا استفاده کنید: docker-compose.memory-optimized.yml
```

---

## ✅ Verification Checklist

بعد از deployment اینها بررسی کن:

```bash
# 1. Containers running؟
docker ps | grep crm

# 2. MySQL working؟
docker exec crm-mysql mysql -u root -p$DATABASE_PASSWORD -e "SHOW DATABASES;"

# 3. Rabin Voice connected؟
curl http://localhost:3001/rabin-voice/api/database?action=test-connection

# 4. Next.js health؟
curl http://localhost:3000/api/health

# 5. ENV files synced؟
grep DATABASE_PASSWORD .env صدای\ رابین/.env | sort | uniq -d

# 6. Domain resolving؟
nslookup crm.robintejarat.com

# 7. SSL certificate؟
sudo ls -la /etc/letsencrypt/live/crm.robintejarat.com/
```

**اگر همه بالا ✅ بود:**
```bash
✨ Deployment موفق!
🎉 System ready for production
```

---

## 📊 Monitoring

```bash
# Real-time logs
docker-compose logs -f

# Container stats
docker stats

# Resource check
free -h
df -h /

# All services status
docker ps -a
```

---

## 🔄 Restart/Redeploy

```bash
# فقط restart containers
docker-compose restart

# فقط rebuild Rabin Voice
docker-compose build rabin-voice
docker-compose up -d rabin-voice

# فقط rebuild Next.js
docker-compose build nextjs
docker-compose up -d nextjs

# تمام چیز از نو (خطرناک!)
docker-compose down -v
bash deploy-server.sh --clean
```

---

## ⚡ Performance Tips

- Swap = مهم برای سرورهای کم‌RAM (< 2GB)
- Memory monitoring = بررسی `docker stats`
- Log rotation = برای جلوگیری از overflow

---

## 📞 Quick Commands Reference

```bash
# فقط MySQL
docker exec crm-mysql mysql -u root -p$DATABASE_PASSWORD

# فقط Rabin Voice logs
docker logs crm-rabin-voice -f

# فقط Next.js logs
docker logs crm-nextjs -f

# تمام logs
docker-compose logs -f

# Container into
docker exec -it crm-rabin-voice /bin/bash

# Restart specific
docker-compose restart rabin-voice
```

---

## ✨ Key Points

| نکته | جزئیات |
|------|--------|
| **یکبار فقط** | `setup-all-env.sh` فقط اول |
| **DATABASE_PASSWORD** | باید هر جا یکسان باشد |
| **Domain DNS** | A record → Server IP |
| **SSL** | Certbot auto-renews |
| **Memory** | < 2GB → script خود swap set می‌کند |
| **Container Order** | MySQL → Rabin → Next.js → Nginx |

---

**اگر سوالی بود:** بخش‌های بالا را بررسی کنید یا اسکریپت logs را ببینید.

✅ Ready to deploy!