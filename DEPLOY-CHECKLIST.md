# ✅ DEPLOY CHECKLIST - قبل از رفتن به سرور

> **این فایل رو چک کن! همه چی یکجا هست.**

---

## 🎯 **Pre-Deployment Verification**

### ✅ **1. Dockerfile Fixed?**
```bash
# بررسی کن که API copy lines موجودند
grep -n "COPY.*api" صدای رابین/Dockerfile
grep -n "COPY.*node_modules" صدای رابین/Dockerfile
```

**Expected:**
```
Line X: COPY --from=builder --chown=nextjs:nodejs /app/api ./api
Line Y: COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
```

✅ **If you see these lines**: Ready to deploy! ✅

---

### ✅ **2. .env Files Synchronized?**
```bash
# بررسی root .env
grep "DATABASE_PASSWORD=" .env

# بررسی rabin .env
grep "DATABASE_PASSWORD=" صدای رابین/.env

# باید یکسان باشند!
diff <(grep DATABASE_PASSWORD .env) <(grep DATABASE_PASSWORD صدای رابین/.env)
```

**Expected:** `(no output = identical)` ✅

---

### ✅ **3. Database Password Consistency?**
```bash
# Root password
grep "DATABASE_PASSWORD=" .env | cut -d'=' -f2

# Init SQL password
grep "IDENTIFIED BY" database/init.sql | head -1

# Rabin .env password
grep "DATABASE_PASSWORD=" صدای رابین/.env | cut -d'=' -f2
```

**Expected:** `All three should match (e.g., 1234)` ✅

---

## 🚀 **Server Deployment Steps**

### Step 1️⃣: SSH to Server
```bash
ssh root@crm.robintejarat.com
cd /root/rabin-last
```

### Step 2️⃣: Pull Latest Changes (if from git)
```bash
# Optional: git pull origin main
```

### Step 3️⃣: Setup Environment (First Time Only)
```bash
bash setup-all-env.sh

# Check output:
# ✓ .env file created
# ✓ صدای رابین/.env created
# ✓ DATABASE_PASSWORD generated
```

### Step 4️⃣: Full Deployment
```bash
bash deploy-server.sh

# This will:
# 1. Generate database/init.sql with PASSWORD
# 2. Build Docker images (including Dockerfile fix)
# 3. Import crm_system.sql & saas_master.sql
# 4. Start all containers
# 5. Configure Nginx
# 6. Setup SSL certificates
```

**⏳ Wait until complete (5-15 minutes)**

### Step 5️⃣: Verify Deployment
```bash
# Check containers
docker ps -a

# Expected status for all:
# STATUS: Up (healthy) or Up

# If any container is Down or Restarting:
docker logs <container_name> | tail -50
```

### Step 6️⃣: Run Full Verification
```bash
bash SERVER-VERIFICATION-COMMANDS.sh

# This will check:
# ✓ All containers running
# ✓ MySQL databases imported
# ✓ Rabin Voice API responding
# ✓ Database connections working
# ✓ Nginx routing correct
```

### Step 7️⃣: Test URLs
```
Open in browser:

1. https://crm.robintejarat.com/
   → Should load main CRM app
   
2. https://crm.robintejarat.com/rabin-voice/
   → Should load Rabin Voice AI
   
3. https://crm.robintejarat.com/secure-db-admin-panel-x7k9m2/
   → Should show phpMyAdmin login
   
4. Console should have NO errors
```

---

## 🔍 **Quick Diagnostics**

### If Rabin Voice Container Crashes:
```bash
# 1. Check logs
docker logs crm-rabin-voice | tail -20

# 2. Verify api/ exists
docker exec crm-rabin-voice ls -la /app/api/index.js

# 3. Rebuild
docker-compose down
docker-compose build --no-cache rabin-voice
docker-compose up -d rabin-voice
```

### If Database Connection Fails:
```bash
# 1. Check MySQL
docker exec crm-mysql mysql -u root -p1234 -e "SHOW DATABASES;"

# 2. Test user
docker exec crm-mysql mysql -u crm_app_user -p1234 crm_system -e "SELECT 1;"

# 3. Check password sync
grep DATABASE_PASSWORD .env صدای رابین/.env
```

### If Nginx Shows 502:
```bash
# 1. Check if rabin-voice is healthy
docker ps | grep rabin-voice

# 2. Test direct connection
curl http://localhost:3001/rabin-voice/

# 3. Check Nginx config
docker exec crm-nginx nginx -T | grep proxy_pass
```

---

## 📋 **Final Checklist**

Before you say "Done":

- [ ] All containers running without restart
- [ ] MySQL shows databases: crm_system, saas_master
- [ ] Rabin Voice API responding: `/rabin-voice/api/database?action=test-connection`
- [ ] Main app loads at: https://crm.robintejarat.com/
- [ ] Rabin Voice loads at: https://crm.robintejarat.com/rabin-voice/
- [ ] No errors in browser console
- [ ] phpMyAdmin accessible
- [ ] DATABASE_PASSWORD synchronized
- [ ] All docker logs clean (no repeated errors)

---

## 🎉 **Success Indicators**

✅ **You'll know everything works when:**

```
docker ps -a output shows:

NAME            STATUS              PORTS
crm-mysql       Up (healthy)        (no ports)
crm-rabin-voice Up (healthy)        (no ports)
crm-nextjs      Up (healthy)        (no ports)
crm-nginx       Up                  0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
crm-phpmyadmin  Up                  (no ports)
```

```
Browser console:
- No 502 errors
- No 404 errors
- No CORS errors
- No database errors
```

```
Test commands:
docker exec crm-rabin-voice curl -s http://localhost:3001/rabin-voice/api/database?action=test-connection
→ Returns: {"success":true, "message":"اتصال به دیتابیس موفق"}
```

---

## 📞 **If Still Having Issues**

### 1. Check the Fix Documents:
- `COMPLETE-FIX-SUMMARY-FINAL.md` - Full explanation
- `DOCKERFILE-CHANGES.md` - What changed and why
- `FINAL-DEPLOYMENT-READY.md` - Detailed verification

### 2. Check Logs:
```bash
docker logs crm-rabin-voice
docker logs crm-nextjs
docker logs crm-nginx
docker logs crm-mysql
```

### 3. Manual Database Test:
```bash
docker exec crm-mysql mysql -u crm_app_user -p1234 crm_system -e "SELECT COUNT(*) as 'Tables' FROM information_schema.tables WHERE table_schema='crm_system';"
```

### 4. Manual API Test:
```bash
docker exec crm-rabin-voice curl http://localhost:3001/rabin-voice/api/database?action=test-connection
```

---

## ⏰ **Expected Timeline**

| Step | Time |
|------|------|
| SSH + Navigate | 1 min |
| setup-all-env.sh | 2 min |
| deploy-server.sh | 5-15 min |
| Verify | 5 min |
| Test URLs | 2 min |
| **Total** | **~20 min** |

---

## 🎊 **Result**

### Before Fix:
```
❌ Container crashes every 10 seconds
❌ api/index.js not found
❌ 502 nginx errors
❌ Database unreachable
```

### After Fix:
```
✅ Container runs smoothly
✅ API responds to requests
✅ Nginx proxies correctly
✅ Database connections work
✅ Everything production-ready
```

---

## 🔐 **Security Check**

Before going live:

- [ ] DATABASE_PASSWORD is NOT "1234" (use strong password)
- [ ] OPENROUTER_API_KEY is set properly
- [ ] SSL certificates are valid
- [ ] phpMyAdmin URL is obscure
- [ ] All .env files have been backed up
- [ ] No secrets in git repository

---

**✨ Good luck with your deployment! 🚀**

**اگر مشکلی پیش آمد، این فایل‌ها رو بخون:**
1. COMPLETE-FIX-SUMMARY-FINAL.md
2. DOCKERFILE-CHANGES.md
3. FINAL-DEPLOYMENT-READY.md
