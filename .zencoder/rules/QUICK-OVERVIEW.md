# 🚀 خلاصه سریع پروژه RABIN CRM

## 📌 چه تعریفی از پروژه؟

یک سیستم **CRM (Customer Relationship Management) چند تجاری‌شده** است که:
- 🏢 **SaaS Platform** است (چندین شرکت می‌تونند از آن استفاده کنند)
- 🎯 **مدیریت مشتریان، محصولات، فروش و وظایف** را انجام می‌دهد
- 🗣️ **دستیار صوتی** (صدای رابین) دارد
- 📊 **گزارش‌ها و تحلیل‌های پیشرفته** فراهم می‌کند
- 💬 **چت و ارتباطات** بین تیم اعضا رو راحت می‌کند

---

## 🏗️ معماری کلی (3 لایه)

```
┌─ SaaS Admin Panel (/secret-zone-789/admin-panel)
│  └─ مدیریت شرکت‌ها، اشتراک‌ها، و بیلینگ
│
├─ Tenant Dashboards (/rabin/dashboard, /company/dashboard)
│  └─ داشبورد هر شرکت با ماژول‌های مختلف
│
└─ Backend APIs (45+ دسته)
   └─ تمام عملیات backend
```

---

## 🗄️ دیتابیس (2 سطح)

### 1. Master Database (saas_master)
- 📌 تمام شرکت‌ها (tenants)
- 👑 ادمین‌های SaaS
- 💳 اطلاعات بیلینگ و subscriptions

### 2. Tenant Databases
- هر شرکت دیتابیس **جداگانه** دارد
- 91+ جدول برای مدیریت تمام اطلاعات
- مثال: `rabin_db`, `irankhodro_db`, ...

---

## 🛣️ 3 نوع Routes

### 1️⃣ SaaS Admin Panel
```
🔗 URL: /secret-zone-789/admin-panel
👤 کاربری: فقط Super Admin
📋 کار: مدیریت تمام شرکت‌ها و اشتراک‌ها
```

### 2️⃣ Tenant Dashboard
```
🔗 URL: /{tenant_key}/dashboard
مثال: /rabin/dashboard, /irankhodro/dashboard
👤 کاربری: کاربران هر شرکت
📋 کار: مدیریت CRM داخلی شرکت
```

### 3️⃣ Old Dashboard (Redirect)
```
🔗 URL: /dashboard/* → /rabin/dashboard/*
👤 کاربری: کاربران معمولی (فقط Rabin)
📋 کار: Backward compatibility
```

---

## 🔐 احراز هویت (3 نوع Token)

```
┌─ auth-token (کاربران معمولی)
├─ tenant_token (کاربران شرکت‌ها)
└─ admin_token (ادمین SaaS)
```

---

## 👥 سطح دسترسی (Roles)

```
1. super_admin → کل سیستم SaaS
2. CEO/مدیر → تمام ماژول‌های شرکت
3. sales_manager → فروش، گزارش، بینش
4. manager → مشتریان، تماس‌ها، وظایف
5. employee → محدود
6. user → تنها داده‌های شخصی
```

---

## 📡 45+ API Categories

```
مهم‌ترین‌ها:
- ✅ /api/auth/* → ورود/خروج
- ✅ /api/admin/* → مدیریت SaaS
- ✅ /api/tenant/* → اطلاعات شرکت
- ✅ /api/customers/* → مشتریان
- ✅ /api/products/* → محصولات
- ✅ /api/sales/* → فروش
- ✅ /api/tasks/* → وظایف
- ✅ /api/reports/* → گزارش‌ها
- ✅ /api/documents/* → اسناد
- ✅ /api/email/* → ایمیل
- ✅ /api/feedback/* → بازخورد
- ✅ /api/permissions/* → دسترسی‌ها
```

---

## 📊 Sidebar Menu (19 ماژول)

```
داشبورد می‌تواند داشته باشد:
├─ Dashboard (صفحه اصلی)
├─ Activities (فعالیت‌ها)
├─ Calendar (تقویم)
├─ Chat (چت)
├─ Contacts (تماس‌ها)
├─ Coworkers (همکاران)
├─ Customer Club (باشگاه مشتریان)
├─ Customers (مشتریان)
├─ Documents (اسناد)
├─ Email (ایمیل)
├─ Feedback (بازخورد)
├─ Insights (بینش‌ها)
├─ Notifications (اطلاعیات)
├─ Products (محصولات)
├─ Profile (پروفایل)
├─ Reports (گزارش‌ها)
├─ Sales (فروش)
├─ Search (جستجو)
├─ Settings (تنظیمات)
└─ Tasks (وظایف)

هر کاربر فقط ماژول‌هایی می‌بیند که اجازه دسترسی دارند!
```

---

## 🔄 Flow یک درخواست عادی

```
کاربر → /rabin/dashboard/customers
         ↓
    Middleware بررسی می‌کند:
    ├─ tenant_key: "rabin" ✓
    ├─ Token صحیح؟ ✓
    ├─ Subscription فعال؟ ✓
    └─ دسترسی به customers؟ ✓
         ↓
    تعیین کن کدام database (rabin_db)
         ↓
    API: /api/customers
         ↓
    دیتابیس: rabin_db.customers
         ↓
    نتیجه: لیست مشتریان
```

---

## 💡 مزیت‌های معماری

✅ **تمام شرکت‌ها به صورت کامل جداگانه‌اند**
✅ **یک کاربر از یک شرکت داده‌های دیگر رو نمی‌بیند**
✅ **اگر یک شرکت down شد، بقیه تحت‌تاثیر نیست**
✅ **آسان scale کردن (هر شرکت دیتابیس خودش)**
✅ **پیدا کردن bug برای یک شرکت آسان‌تر است**

---

## ⚠️ مشکلات شناسایی شده

### 1. Database Issues
- ❌ Collation mismatches (utf8mb4_unicode_ci vs utf8mb4_general_ci)
- ❌ Some foreign key constraints missing
- ❌ Duplicate data in some tables
- ❌ Migration inconsistencies

### 2. Code Issues
- ❌ Some API endpoints are slow with large datasets
- ❌ Duplicate code in multiple API handlers
- ❌ Error handling not consistent
- ❌ Rate limiting not implemented
- ❌ Caching layer missing (Redis)

### 3. Architecture Issues
- ❌ Password encryption/decryption for tenant DBs
- ❌ Connection pooling could be optimized
- ❌ No circuit breaker pattern
- ❌ Limited logging and monitoring

### 4. Security Issues
- ⚠️ CORS configuration too permissive
- ⚠️ Some endpoints missing permission checks
- ⚠️ Email credentials in code (should be .env)
- ⚠️ No API rate limiting
- ⚠️ No request validation in some endpoints

### 5. Testing & Documentation
- ❌ No unit tests
- ❌ No integration tests
- ❌ Limited API documentation
- ⚠️ Some endpoints undocumented

---

## 🎯 بهترین عملیات

✅ **هر tenant یک connection pool داره**
✅ **Tenant configs cached (5 min TTL)**
✅ **JWT tokens برای stateless auth**
✅ **Middleware for centralized validation**
✅ **Dynamic sidebar menu based on permissions**
✅ **Consistent response format**

---

## 📁 فایل‌های مهم

```
app/
├─ api/admin/* → SaaS Admin APIs
├─ api/tenant/* → Tenant APIs
├─ api/auth/* → Authentication
├─ dashboard/* → Old dashboard
└─ [tenant_key]/dashboard/* → New tenant dashboard

lib/
├─ auth.ts → User auth logic
├─ tenant-auth.ts → Tenant auth logic
├─ admin-auth.ts → Admin auth logic
├─ permissions.ts → Permission checking
├─ tenant-database.ts → Tenant DB manager
└─ master-database.ts → Master DB manager

database/
├─ saas-master-schema.sql → Master schema
├─ tenant-template.sql → Tenant template
└─ migrations/* → Database migrations

middleware.ts → Main middleware (tenant detection + auth)
```

---

## 🚀 چه‌کاری‌هایی باید انجام شود؟

### Priority 1 (High)
- [ ] Fix database collation issues
- [ ] Implement connection pooling optimization
- [ ] Add comprehensive error handling
- [ ] Implement CORS security
- [ ] Fix permission checking inconsistencies

### Priority 2 (Medium)
- [ ] Implement caching layer (Redis)
- [ ] Add rate limiting
- [ ] Optimize slow APIs
- [ ] Add request validation
- [ ] Implement circuit breaker pattern

### Priority 3 (Low)
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Improve documentation
- [ ] Refactor duplicate code
- [ ] Add monitoring/logging

---

## 🔍 چطوری دیباگ کنیم؟

### 1. بررسی Middleware
```bash
# لاگ کردن tenant detection
# File: middleware.ts
# Check: console logs about tenant extraction
```

### 2. بررسی Database Connection
```bash
# Script: scripts/check-database-structure.cjs
node scripts/check-database-structure.cjs
```

### 3. بررسی API
```bash
# Direct database query
SELECT * FROM users WHERE email = 'test@example.com';

# Check tenant info
SELECT * FROM tenants WHERE tenant_key = 'rabin';
```

### 4. بررسی Permissions
```bash
# Query user permissions
SELECT m.name FROM user_module_permissions ump
JOIN modules m ON ump.module_id = m.id
WHERE ump.user_id = ? AND ump.granted = 1;
```

---

## 📞 مهم‌ترین لینک‌ها

- SaaS Panel: `http://localhost:3000/secret-zone-789/admin-panel`
- Rabin Dashboard: `http://localhost:3000/rabin/dashboard`
- API Docs: `/api/health` (basic health check)
- Database: Master DB + Tenant DBs

---

## ✨ خلاصه کلی

```
این یک CRM حرفه‌ای است که:
- قابل استفاده برای چندین شرکت (SaaS)
- هر شرکت کاملاً جدا و ایزوله‌شده
- دارای 150+ API endpoint
- سیستم دسترسی پایه‌رولز
- Middleware-based authentication
- Dynamic routing based on tenant_key

اما نیاز به:
- Fix database issues
- Improve security
- Add testing
- Better error handling
- Performance optimization
```

---

**آنالیز توسط Zencoder**
**تاریخ: 2024**