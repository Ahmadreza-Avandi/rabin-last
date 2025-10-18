# 🚀 راهنمای سیستم Multi-Tenant SaaS

## ✅ وضعیت فعلی سیستم

### 1️⃣ ساختار دیتابیس
- **Master Database** (`saas_master`): مدیریت tenants، پلن‌ها، super admins
- **Shared Database** (`crm_system`): داده‌های همه tenants با جداسازی `tenant_key`

### 2️⃣ Tenants موجود
```
- rabin (شرکت رابین تجارت) - پیش‌فرض
- samin (شرکت سامین)
- testcompany (شرکت تست)
```

### 3️⃣ URL Structure

#### Admin Panel (Super Admin):
```
http://localhost:3000/secret-zone-789/login
Username: Ahmadreza.avandi
Password: Ahmadreza.avandi
```

#### Tenant Login:
```
http://localhost:3000/{tenant_key}/login
مثال: http://localhost:3000/samin/login
```

#### Tenant Dashboard:
```
http://localhost:3000/{tenant_key}/dashboard
مثال: http://localhost:3000/samin/dashboard
```

## 📋 کارهای انجام شده

### ✅ Backend
1. Master Database با جداول tenants, super_admins, subscription_plans
2. Middleware برای tenant detection
3. API های Admin Panel (لیست tenants، آمار، مدیریت پلن‌ها)
4. API های Tenant Authentication
5. Tenant-aware database queries

### ✅ Frontend
1. صفحه لاگین Admin Panel
2. Dashboard Admin Panel با مدیریت tenants
3. صفحه لاگین Tenant با UI اصلی CRM
4. Dashboard Tenant (نسخه اولیه)

### ⚠️ کارهای باقی‌مانده

#### 1. انتقال کامل صفحات Dashboard
صفحات زیر باید از `app/dashboard/*` به `app/[tenant_key]/dashboard/*` منتقل شوند:
- customers
- contacts  
- coworkers
- activities
- chat
- deals
- feedback
- reports
- insights
- settings

#### 2. به‌روزرسانی API های قدیمی
API های زیر باید tenant-aware شوند:
- `/api/customers`
- `/api/contacts`
- `/api/activities`
- `/api/deals`
- و غیره...

#### 3. به‌روزرسانی Sidebar
Sidebar باید لینک‌ها را با prefix tenant_key بسازد:
- `/dashboard` → `/{tenant_key}/dashboard`
- `/customers` → `/{tenant_key}/customers`

## 🔧 راه حل موقت

### برای تست سیستم:
1. به `http://localhost:3000/samin/login` برو
2. با `admin@samin.com` / `Samin1234` لاگین کن
3. به dashboard می‌رسی

### برای استفاده از صفحات قدیمی:
فعلا middleware route های قدیمی را به `/rabin/*` redirect می‌کند:
- `/dashboard` → `/rabin/dashboard`
- `/customers` → `/rabin/customers`

## 📝 دستورات مفید

### ایجاد Tenant جدید:
```bash
node scripts\simple-register-tenant.cjs <tenant_key> "<company_name>" "<email>" "<name>" "<password>" "<plan>" <months>

# مثال:
node scripts\simple-register-tenant.cjs mycompany "شرکت من" "admin@mycompany.com" "مدیر" "Pass1234" "professional" 12
```

### اضافه کردن کاربر به Tenant:
```bash
node scripts\add-user-to-tenant.cjs <tenant_key> "<name>" "<email>" "<password>"

# مثال:
node scripts\add-user-to-tenant.cjs samin "کاربر جدید" "user@samin.com" "User1234"
```

### بررسی Tenant:
```bash
node scripts\test-tenant-user.cjs <tenant_key>

# مثال:
node scripts\test-tenant-user.cjs samin
```

## 🎯 مراحل بعدی (اولویت‌دار)

1. **کپی کردن صفحات dashboard** به ساختار tenant
2. **به‌روزرسانی Sidebar** برای استفاده از tenant_key
3. **به‌روزرسانی API های قدیمی** برای فیلتر کردن با tenant_key
4. **تست کامل** با چند tenant مختلف

## 🐛 مشکلات شناخته شده

1. **Sidebar Links**: لینک‌های sidebar به route های قدیمی می‌روند
2. **API های قدیمی**: هنوز tenant-aware نیستند
3. **صفحات Dashboard**: فقط صفحه اصلی dashboard منتقل شده

## 💡 نکات مهم

- همه داده‌ها در یک دیتابیس (`crm_system`) با `tenant_key` جدا می‌شوند
- هر tenant می‌تواند کاربران، مشتریان، و داده‌های خودش را داشته باشد
- Admin Panel کاملا جدا از tenant ها است
- Authentication tenant-specific است (هر tenant session جداگانه دارد)
