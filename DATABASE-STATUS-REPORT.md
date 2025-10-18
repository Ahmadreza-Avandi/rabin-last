# 📊 گزارش وضعیت دیتابیس

## ✅ جداول با Tenant Isolation (11 جدول)

این جداول آماده هستند و بر اساس tenant_key فیلتر می‌شوند:

1. ✅ **users** - 7 کاربر (5 rabin, 1 samin, 1 testcompany)
2. ✅ **customers** - 600 مشتری (همه rabin)
3. ✅ **contacts** - 25 مخاطب (همه rabin)
4. ✅ **activities** - 18 فعالیت (همه rabin)
5. ✅ **tasks** - 4 وظیفه (همه rabin)
6. ✅ **deals** - 10 معامله (همه rabin)
7. ✅ **products** - 17 محصول (همه rabin)
8. ✅ **feedback** - 10 بازخورد (همه rabin)
9. ✅ **documents** - 1 سند (rabin)
10. ✅ **calendar_events** - 6 رویداد (همه rabin)
11. ✅ **tickets** - 0 تیکت

## ❌ جداول بدون Tenant Isolation (80 جدول)

این جداول هنوز tenant_key ندارند و باید اضافه شود:

### جداول مهم که نیاز فوری دارند:
- **sales** (10 رکورد) - فروش
- **chat_messages** (2 رکورد) - پیام‌های چت
- **daily_reports** (1 رکورد) - گزارش‌های روزانه
- **notifications** (21 رکورد) - اعلان‌ها
- **interactions** (0 رکورد) - تعاملات

### جداول کمکی:
- sale_items, deal_products, task_assignees, etc.

## 🎯 وضعیت فعلی

### ✅ کارهای انجام شده:
1. 11 جدول اصلی tenant_key دارند
2. API های زیر ایجاد شدند:
   - `/api/tenant/customers-simple`
   - `/api/tenant/coworkers`
   - `/api/tenant/documents`
   - `/api/tenant/sales`
   - `/api/tenant/chat`

### 🔄 کارهای باقی‌مانده:

#### 1. اضافه کردن tenant_key به جداول مهم:
```sql
ALTER TABLE sales ADD COLUMN tenant_key VARCHAR(50) DEFAULT 'rabin' AFTER id;
ALTER TABLE chat_messages ADD COLUMN tenant_key VARCHAR(50) DEFAULT 'rabin' AFTER id;
ALTER TABLE daily_reports ADD COLUMN tenant_key VARCHAR(50) DEFAULT 'rabin' AFTER id;
ALTER TABLE notifications ADD COLUMN tenant_key VARCHAR(50) DEFAULT 'rabin' AFTER id;
ALTER TABLE interactions ADD COLUMN tenant_key VARCHAR(50) DEFAULT 'rabin' AFTER id;
```

#### 2. اصلاح API های موجود:
- `/api/tenant/customers` - اضافه کردن فیلتر tenant_key
- `/api/tenant/activities` - اضافه کردن فیلتر tenant_key
- `/api/tenant/tasks` - اضافه کردن فیلتر tenant_key

#### 3. اصلاح Frontend:
- coworkers page: اضافه کردن `const tenantKey = params.tenant_key`
- activities page: اضافه کردن header `X-Tenant-Key`
- tasks page: اضافه کردن header `X-Tenant-Key`

## 📝 دستورات SQL برای اجرا دستی

```sql
-- اضافه کردن tenant_key به جداول مهم
ALTER TABLE sales ADD COLUMN tenant_key VARCHAR(50) DEFAULT 'rabin' AFTER id;
ALTER TABLE sales ADD INDEX idx_tenant_key (tenant_key);

ALTER TABLE chat_messages ADD COLUMN tenant_key VARCHAR(50) DEFAULT 'rabin' AFTER id;
ALTER TABLE chat_messages ADD INDEX idx_tenant_key (tenant_key);

ALTER TABLE daily_reports ADD COLUMN tenant_key VARCHAR(50) DEFAULT 'rabin' AFTER id;
ALTER TABLE daily_reports ADD INDEX idx_tenant_key (tenant_key);

ALTER TABLE notifications ADD COLUMN tenant_key VARCHAR(50) DEFAULT 'rabin' AFTER id;
ALTER TABLE notifications ADD INDEX idx_tenant_key (tenant_key);

ALTER TABLE interactions ADD COLUMN tenant_key VARCHAR(50) DEFAULT 'rabin' AFTER id;
ALTER TABLE interactions ADD INDEX idx_tenant_key (tenant_key);

-- جداول کمکی
ALTER TABLE sale_items ADD COLUMN tenant_key VARCHAR(50) DEFAULT 'rabin' AFTER id;
ALTER TABLE task_assignees ADD COLUMN tenant_key VARCHAR(50) DEFAULT 'rabin' AFTER id;
ALTER TABLE deal_products ADD COLUMN tenant_key VARCHAR(50) DEFAULT 'rabin' AFTER id;
```

## 🚀 مراحل بعدی

1. **اجرای SQL دستورات بالا** در phpMyAdmin یا MySQL Workbench
2. **Restart سرور Next.js**
3. **تست با tenant rabin** - باید فقط داده‌های rabin را ببیند
4. **تست با tenant samin** - باید فقط داده‌های samin را ببیند

## 📞 تست Isolation

```bash
# تست 1: لاگین با rabin
# Email: Robintejarat@gmail.com
# باید ببیند: 5 کاربر، 600 مشتری

# تست 2: لاگین با samin
# Email: admin@samin.com
# باید ببیند: 1 کاربر، 0 مشتری
```
