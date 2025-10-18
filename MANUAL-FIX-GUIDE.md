# 📘 راهنمای حل دستی مشکلات

## ✅ کارهای انجام شده

1. ✅ 21 جدول حالا tenant_key دارند
2. ✅ 5 API جدید ایجاد شدند
3. ✅ Index ها برای tenant_key ایجاد شدند

## 🔧 مشکلات باقی‌مانده و راه‌حل‌ها

### مشکل 1: `tenantKey is not defined` در coworkers page

**فایل:** `app/[tenant_key]/dashboard/coworkers/page.tsx`

**راه‌حل:** در ابتدای component اضافه کنید:
```typescript
import { useParams } from 'next/navigation';

// در داخل component:
const params = useParams();
const tenantKey = params.tenant_key as string;
```

سپس در تمام fetch ها از `tenantKey` استفاده کنید:
```typescript
headers: {
  'X-Tenant-Key': tenantKey,
  // ...
}
```

### مشکل 2: Chat authentication error

**فایل:** `app/[tenant_key]/dashboard/chat/page.tsx`

**راه‌حل:** مطمئن شوید که:
1. `tenant_token` cookie ارسال می‌شود
2. Header `X-Tenant-Key` ارسال می‌شود

### مشکل 3: Documents نمی‌تواند لیست بگیرد

**API ایجاد شده:** ✅ `/api/tenant/documents/route.ts`

**راه‌حل Frontend:** در صفحه documents مطمئن شوید:
```typescript
const response = await fetch('/api/tenant/documents', {
  headers: {
    'X-Tenant-Key': tenantKey,
    'Authorization': `Bearer ${token}`
  }
});
```

### مشکل 4: Sales page بالا نمی‌آید

**API ایجاد شده:** ✅ `/api/tenant/sales/route.ts`

**راه‌حل:** Restart سرور و مطمئن شوید headers درست ارسال می‌شوند

### مشکل 5: Tasks به login redirect می‌کند

**علت:** Session validation

**راه‌حل:** بررسی کنید که:
1. Cookie `tenant_token` set شده
2. Token معتبر است
3. Middleware `X-Tenant-Key` را set می‌کند

### مشکل 6: Activities 400 error

**راه‌حل:** بررسی کنید API `/api/tenant/activities` فیلتر tenant_key دارد:
```typescript
WHERE tenant_key = ? AND ...
```

## 🎯 چک‌لیست حل مشکلات

### Frontend:
- [ ] coworkers page: اضافه کردن `tenantKey` از `useParams()`
- [ ] chat page: اضافه کردن headers
- [ ] documents page: اضافه کردن headers
- [ ] sales page: اضافه کردن headers
- [ ] tasks page: اضافه کردن headers
- [ ] activities page: اضافه کردن headers

### Backend APIs:
- [ ] `/api/tenant/customers` - فیلتر tenant_key
- [ ] `/api/tenant/activities` - فیلتر tenant_key
- [ ] `/api/tenant/tasks` - فیلتر tenant_key

### Database:
- [x] اضافه کردن tenant_key به جداول اصلی
- [x] ایجاد index ها

## 🚀 مراحل تست

### 1. Restart سرور
```bash
Ctrl+C
npm run dev
```

### 2. تست با tenant rabin
- Login: `Robintejarat@gmail.com`
- بررسی: فقط 5 کاربر rabin را ببیند
- بررسی: فقط 600 مشتری rabin را ببیند

### 3. تست با tenant samin
- Login: `admin@samin.com`
- بررسی: فقط 1 کاربر samin را ببیند
- بررسی: 0 مشتری (چون هنوز مشتری ندارد)

## 📝 اسکریپت‌های کمکی

```bash
# بررسی کامل دیتابیس
node scripts/inspect-database-full.cjs

# بررسی tenant isolation
node scripts/check-tenant-isolation.cjs

# تشخیص مشکلات
node scripts/diagnose-all-issues.cjs
```

## 💡 نکات مهم

1. **همیشه tenant_key را چک کنید** در تمام query ها
2. **همیشه X-Tenant-Key header بفرستید** از frontend
3. **Session validation** را فراموش نکنید
4. **Restart سرور** بعد از تغییرات API

## 📞 پشتیبانی

اگر مشکلی داشتید:
1. Console مرورگر را چک کنید (F12)
2. لاگ سرور Next.js را چک کنید
3. اسکریپت‌های تشخیصی را اجرا کنید
