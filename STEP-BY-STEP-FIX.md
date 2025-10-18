# 🔧 راهنمای گام به گام حل مشکلات

## ✅ کارهای انجام شده

1. ✅ اضافه کردن `tenant_key` به تمام جداول
2. ✅ ایجاد `/api/tenant/customers-simple`
3. ✅ ایجاد `/api/tenant/coworkers`
4. ✅ اصلاح `/api/tenant/users` برای فیلتر tenant_key

## 🔄 کارهای باقی‌مانده

### مرحله 1: ایجاد API های گمشده

```bash
# این API ها باید ایجاد شوند:
1. app/api/tenant/documents/route.ts
2. app/api/tenant/sales/route.ts  
3. app/api/tenant/chat/route.ts
```

### مرحله 2: اصلاح Frontend

```typescript
// در coworkers page، tenantKey را از useParams بگیرید:
const params = useParams();
const tenantKey = params.tenant_key as string;
```

### مرحله 3: اصلاح تمام API های موجود

تمام API ها باید:
- `tenant_key` را از headers بگیرند
- در query ها `WHERE tenant_key = ?` اضافه کنند
- Session را validate کنند

## 🚀 اجرای سریع

من الان API های گمشده را ایجاد می‌کنم...
