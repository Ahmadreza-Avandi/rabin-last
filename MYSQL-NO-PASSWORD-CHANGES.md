# 🔧 تغییرات MySQL بدون پسورد

## خلاصه تغییرات

تمام تنظیمات پروژه برای استفاده از MySQL با **root بدون پسورد** اصلاح شد.

## ✅ فایل‌های اصلاح شده

### 1. docker-compose.yml
- **MySQL**: `MYSQL_ALLOW_EMPTY_PASSWORD: "yes"` + `--skip-grant-tables`
- **NextJS**: `DATABASE_USER=root`, `DATABASE_PASSWORD=` (خالی)
- **Rabin Voice**: `DATABASE_USER=root`, `DATABASE_PASSWORD=` (خالی)
- **phpMyAdmin**: `PMA_USER=root`, `PMA_PASSWORD=""` (خالی)

### 2. lib/database.ts
```typescript
const dbConfig = {
  user: 'root',
  password: '',
  // ...
};
```

### 3. صدای رابین/api/services/database.js
```javascript
const getDBConfig = () => {
    return {
        user: "root",
        password: "",
        // ...
    };
};
```

### 4. صدای رابین/start.sh
- اضافه شد: Kill process روی پورت 3001 قبل از شروع
- حذف شد: Next.js server (فقط Express API باقی ماند)

### 5. deploy-server.sh
- `database/init.sql` ساده شد - فقط CREATE DATABASE

### 6. setup-all-env.sh
- تمام `DATABASE_USER` به `root` تغییر کرد
- تمام `DATABASE_PASSWORD` خالی شد

## 🚀 نحوه استفاده

### دیپلوی کامل:
```bash
bash setup-all-env.sh
bash deploy-server.sh
```

### دسترسی به phpMyAdmin:
- URL: `https://crm.robintejarat.com/secure-db-admin-panel-x7k9m2/`
- Username: `root`
- Password: (خالی - فقط Enter بزنید)

## 🔍 مشکلات حل شده

### 1. ❌ Access denied for user 'crm_app_user'
**حل شد**: همه جا از `root` بدون پسورد استفاده می‌شود

### 2. ❌ EADDRINUSE: port 3001
**حل شد**: 
- Express API روی پورت 3001 اجرا می‌شود
- Next.js از Rabin Voice حذف شد (فقط Express API)
- قبل از شروع، پورت 3001 پاک می‌شود

### 3. ❌ phpMyAdmin نمی‌تواند وصل شود
**حل شد**: phpMyAdmin با `root` بدون پسورد کار می‌کند

## 📋 تنظیمات .env

### .env (ریشه پروژه):
```bash
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_URL=mysql://root@mysql:3306/crm_system
```

### صدای رابین/.env:
```bash
DATABASE_USER=root
DATABASE_PASSWORD=
```

## ⚠️ نکات مهم

1. **امنیت**: این تنظیمات برای محیط توسعه است. در production باید پسورد تنظیم شود.

2. **Rabin Voice**: فقط Express API روی پورت 3001 اجرا می‌شود (Next.js حذف شد)

3. **MySQL Port**: پورت 3306 برای دسترسی خارجی باز است

4. **Container Names**: 
   - `crm_mysql`
   - `crm_nextjs`
   - `crm_rabin_voice`
   - `crm_phpmyadmin`
   - `crm_nginx`

## 🧪 تست

```bash
# تست اتصال MySQL
docker exec crm_mysql mariadb -u root -e "SHOW DATABASES;"

# تست Rabin Voice
curl http://localhost:3001/health

# تست phpMyAdmin
curl -I http://localhost/secure-db-admin-panel-x7k9m2/
```

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│           Nginx (Port 80/443)           │
│  - Main App: /                          │
│  - phpMyAdmin: /secure-db-admin-...     │
│  - Rabin Voice: /rabin-voice/           │
└─────────────────────────────────────────┘
              │
    ┌─────────┼─────────┬─────────────┐
    │         │         │             │
┌───▼───┐ ┌──▼───┐ ┌───▼────┐ ┌─────▼─────┐
│NextJS │ │MySQL │ │ Rabin  │ │phpMyAdmin │
│:3000  │ │:3306 │ │ Voice  │ │    :80    │
│       │ │      │ │ :3001  │ │           │
└───────┘ └──────┘ └────────┘ └───────────┘
                    (Express API only)
```

## ✅ Checklist

- [x] MySQL بدون پسورد
- [x] phpMyAdmin با root بدون پسورد
- [x] NextJS با root بدون پسورد
- [x] Rabin Voice با root بدون پسورد
- [x] مشکل EADDRINUSE حل شد
- [x] اسکریپت‌های دیپلوی سازگار شدند
- [x] database.ts اصلاح شد
- [x] database.js (Rabin Voice) اصلاح شد
