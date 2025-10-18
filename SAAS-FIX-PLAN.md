# 🔧 نقشه راه کامل برای تبدیل به SaaS واقعی

## 📋 مشکلات فعلی

### 1. ❌ Tenant Isolation نیست
- همه tenants در یک دیتابیس (`crm_system`) هستند
- API ها بر اساس `tenant_key` فیلتر نمی‌کنند
- کاربران tenant دیگر را می‌بینند

### 2. ❌ API های گمشده
- `/api/tenant/customers-simple` - 404
- `/api/tenant/coworkers` - 404
- `/api/tenant/activities` - 400

### 3. ❌ مشکلات Authentication
- برخی صفحات به login redirect می‌کنند
- Token validation درست کار نمی‌کند

### 4. ❌ مشکلات Frontend
- `tenantKey is not defined` در coworkers page
- Chat authentication error
- Documents نمی‌تواند لیست بگیرد

## 🎯 راه‌حل: دو رویکرد

### رویکرد 1: Multi-Database (پیشنهادی برای SaaS واقعی)
هر tenant دیتابیس جداگانه دارد

### رویکرد 2: Single Database with Tenant Key (سریع‌تر برای شروع)
همه در یک دیتابیس با فیلتر `tenant_key`

## 📝 مراحل پیاده‌سازی (رویکرد 2)

### مرحله 1: ✅ Database Schema
- [x] اضافه کردن `tenant_key` به تمام جداول
- [x] ایجاد index برای `tenant_key`
- [ ] Migration داده‌های موجود

### مرحله 2: 🔄 API Routes
باید تمام API ها را اصلاح کنیم:

#### APIs که باید اصلاح شوند:
1. `/api/tenant/users` - ✅ Fixed
2. `/api/tenant/customers` - نیاز به اصلاح
3. `/api/tenant/customers-simple` - نیاز به ایجاد
4. `/api/tenant/coworkers` - نیاز به ایجاد
5. `/api/tenant/activities` - نیاز به اصلاح
6. `/api/tenant/tasks` - نیاز به اصلاح
7. `/api/tenant/documents` - نیاز به اصلاح
8. `/api/tenant/chat` - نیاز به اصلاح
9. `/api/tenant/sales` - نیاز به اصلاح
10. `/api/tenant/products` - نیاز به اصلاح

### مرحله 3: 🔐 Authentication
- [ ] اطمینان از `tenant_token` در همه جا
- [ ] Middleware برای تنظیم `X-Tenant-Key`
- [ ] Session validation

### مرحله 4: 🎨 Frontend
- [ ] اصلاح coworkers page برای استفاده از `tenantKey`
- [ ] اصلاح تمام fetch calls برای ارسال `X-Tenant-Key`
- [ ] Error handling بهتر

## 🚀 اجرای سریع

```bash
# 1. اضافه کردن tenant_key به جداول
node scripts/add-tenant-key-to-tables.cjs

# 2. ایجاد API های گمشده
node scripts/create-missing-apis.cjs

# 3. اصلاح API های موجود
node scripts/fix-all-apis-for-tenant.cjs

# 4. تست
node scripts/test-tenant-isolation.cjs
```
