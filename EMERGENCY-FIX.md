# 🚨 EMERGENCY FIX - دو مشکل بسیار اهم

## مشکل 1: `.next/standalone` ساخته نمی‌شود
```
Error: Cannot find module '/app/.next/standalone/server.js'
```

### علت:
- `npm run build` در Dockerfile **fail** شده است
- یا build process **incomplete** است

### حل:
**Step 1:** صدای رابین میں build logs دیکھنے کے لیے:

```bash
# Build rabin-voice صحیح از برو (fresh)
cd /راب-last
docker-compose build --no-cache rabin-voice 2>&1 | tee rabin-build.log
```

**Step 2:** دیکھنے کے لیے:
```bash
# کیا .next/standalone میں build ہوا؟
docker run -it rabin-last-rabin-voice ls -la .next/
docker run -it rabin-last-rabin-voice ls -la .next/standalone/
```

---

## مشکل 2: phpMyAdmin نمی‌تونه MySQL connect کنه
```
Access denied for user 'crm_app_user'@'172.18.0.4'
```

### بررسی کنید:

```bash
# 1. آیا MySQL healthy است؟
docker ps | grep crm-mysql

# 2. آیا user create شد؟
docker exec crm-mysql mysql -u root -p1234 -e "SELECT User, Host FROM mysql.user WHERE User='crm_app_user';"

# 3. آیا GRANT صحیح است؟
docker exec crm-mysql mysql -u root -p1234 -e "SHOW GRANTS FOR 'crm_app_user'@'%';"

# 4. Connection test:
docker exec crm-mysql mysql -u crm_app_user -p1234 crm_system -e "SELECT 1;"
```

---

## Quick Troubleshooting

```bash
# تمام Docker logs دیکھیں
docker logs crm-rabin-voice 2>&1 | grep -i error | head -20
docker logs crm-mysql 2>&1 | grep -i error | head -20
docker logs crm-nginx 2>&1 | grep -i error | head -20

# Network check
docker network inspect rabin-last_crm-network | grep -A 5 "Containers"

# DNS resolution check
docker exec crm-nginx wget -v http://rabin-voice:3001 2>&1 | head -20
```

---

## اگر مشکل حل نشد - Clean Restart:

```bash
# تمام container clean کریں
docker-compose down -v

# Cache پاک کریں
docker system prune -a -f

# دوباره شروع کریں
bash setup-all-env.sh
bash deploy-server.sh
```
