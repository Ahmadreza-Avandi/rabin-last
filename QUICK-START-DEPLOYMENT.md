# ⚡ Quick Start - Deploy in 2 Steps

## Step 1️⃣: Setup Environment (یک‌بار)
```bash
bash setup-all-env.sh
```
**Takes:** ~2 minutes
**Does:** ENV files + Database password setup

---

## Step 2️⃣: Deploy Server
```bash
bash deploy-server.sh
```
**Takes:** 10-20 minutes (first time)
**Does:** Build + Start all services

---

## ✅ Verify It's Working
```bash
# Check all containers running
docker ps

# Check Rabin Voice API
curl http://localhost:3001/rabin-voice

# Check CRM is accessible
curl http://localhost:3000

# Check MySQL
docker exec crm-mysql mysql -u root -p1234 -e "SELECT 1"
```

**Expected:**
- ✅ 5 containers running
- ✅ Rabin Voice API responds
- ✅ CRM page loads
- ✅ MySQL: "Query OK"

---

## 🔄 If You Need to Rebuild
```bash
bash deploy-server.sh --clean
```

---

## 📖 Full Guide
See: [DEPLOYMENT-INSTRUCTIONS.md](./DEPLOYMENT-INSTRUCTIONS.md)

## ✓ Checklist
See: [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)

---

## 🎯 Key Points

| Item | Value |
|------|-------|
| **Database Password** | 1234 |
| **Database User** | crm_app_user |
| **Rabin Voice Port** | 3001 |
| **CRM Port** | 3000 |
| **phpMyAdmin URL** | /secure-db-admin-panel-x7k9m2/ |

---

## ⚙️ What Gets Set Up Automatically

✅ `.env` file with all variables  
✅ `صدای رابین/.env` with DATABASE_PASSWORD  
✅ MySQL database + users  
✅ Docker containers build  
✅ All services start  
✅ Health checks configured  
✅ Permissions set correctly  

---

## 🚀 Ready to Deploy?

```bash
bash setup-all-env.sh && bash deploy-server.sh
```

Then check: `docker ps`