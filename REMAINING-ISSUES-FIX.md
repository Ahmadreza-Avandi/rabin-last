# رفع مشکلات باقیمانده

## تاریخ: 1403/07/26 - ساعت 21:45

---

## ✅ مشکلات فیکس شده:

### 1. Documents - خطای toUpperCase
**خطا:** `Cannot read properties of undefined (reading 'toUpperCase')`

**فیکس:**
```typescript
// قبل:
{document.format.toUpperCase()}

// بعد:
{(document.format || '').toUpperCase()}
```

**فایل:** `app/[tenant_key]/dashboard/documents/page.tsx`
**وضعیت:** ✅ فیکس شد

---

### 2. Activities API - 405 Method Not Allowed
**خطا:** `POST http://localhost:3000/api/tenant/activities 405`

**علت:** API فقط GET داشت

**فیکس:** اضافه کردن متد POST

**فایل:** `app/api/tenant/activities/route.ts`

**قابلیت‌های POST:**
- ✅ احراز هویت
- ✅ Validation (customer_id و title الزامی)
- ✅ ثبت فعالیت در دیتابیس
- ✅ Tenant isolation

**وضعیت:** ✅ فیکس شد

---

## ⚠️ مشکلات نیازمند بررسی:

### 3. Tasks - Redirect به Login
**مشکل:** وقتی به `/rabin/dashboard/tasks` می‌روید، به `/rabin/login` redirect می‌شود

**علل احتمالی:**
1. Token منقضی شده
2. Session نامعتبر
3. مشکل در fetchCurrentUser

**راه حل‌های پیشنهادی:**

#### الف) بررسی Token:
```javascript
// در Console:
console.log('Token:', document.cookie);
console.log('Auth Token:', document.cookie
  .split('; ')
  .find(row => row.startsWith('auth-token=')));
```

#### ب) لاگین مجدد:
1. به `/rabin/login` بروید
2. دوباره لاگین کنید
3. به `/rabin/dashboard/tasks` بروید

#### ج) پاک کردن Cache:
```javascript
// در Console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

### 4. Sales/New - Redirect به tenant-not-found
**مشکل:** بعد از ثبت فروش، به `/tenant-not-found` redirect می‌شود

**علل احتمالی:**
1. `tenantKey` خالی است
2. مشکل در router.push
3. middleware مشکل دارد

**بررسی:**

#### الف) چک کردن tenantKey:
```typescript
// در sales/new/page.tsx
console.log('Tenant Key:', tenantKey);
console.log('Params:', params);
```

#### ب) چک کردن URL:
```typescript
// قبل از redirect
console.log('Redirecting to:', `/${tenantKey}/dashboard/sales`);
```

#### ج) بررسی middleware:
```typescript
// در middleware.ts
// بررسی کنید که tenant-not-found چه موقع فراخوانی می‌شود
```

---

## 🔧 فیکس‌های پیشنهادی:

### برای Tasks:

**فایل:** `app/[tenant_key]/dashboard/tasks/page.tsx`

```typescript
const fetchCurrentUser = async () => {
  try {
    const token = getAuthToken();
    
    // اضافه کردن log
    console.log('🔍 Fetching current user...');
    console.log('Token exists:', !!token);
    console.log('Tenant Key:', tenantKey);
    
    if (!token) {
      console.error('❌ No auth token found');
      // به جای redirect فوری، نمایش پیام
      toast({
        title: "خطا",
        description: "لطفاً دوباره وارد شوید",
        variant: "destructive"
      });
      // منتظر بمانید تا کاربر پیام را ببیند
      setTimeout(() => {
        window.location.href = `/${tenantKey}/login`;
      }, 2000);
      return;
    }
    
    // ادامه کد...
  } catch (error) {
    console.error('Error:', error);
    // نمایش خطا به جای redirect
    toast({
      title: "خطا",
      description: "خطا در دریافت اطلاعات کاربر",
      variant: "destructive"
    });
  }
};
```

---

### برای Sales/New:

**فایل:** `app/[tenant_key]/dashboard/sales/new/page.tsx`

```typescript
if (data.success) {
  // اضافه کردن log
  console.log('✅ Sale created successfully');
  console.log('Tenant Key:', tenantKey);
  console.log('Redirect URL:', `/${tenantKey}/dashboard/sales`);
  
  toast({
    title: "موفقیت",
    description: "فروش با موفقیت ثبت شد",
  });
  
  // بررسی tenantKey قبل از redirect
  if (!tenantKey) {
    console.error('❌ Tenant key is empty!');
    toast({
      title: "خطا",
      description: "خطا در redirect",
      variant: "destructive"
    });
    return;
  }
  
  router.push(`/${tenantKey}/dashboard/sales`);
}
```

---

## 🧪 مراحل تست:

### 1. تست Activities:
```bash
# در صفحه activities، فرم را پر کنید و submit کنید
# باید پیام موفقیت نمایش دهد
```

### 2. تست Tasks:
```bash
# 1. Console را باز کنید (F12)
# 2. به /rabin/dashboard/tasks بروید
# 3. Log ها را بررسی کنید
# 4. اگر redirect شد، علت را در log ببینید
```

### 3. تست Sales/New:
```bash
# 1. Console را باز کنید
# 2. فرم را پر کنید
# 3. Submit کنید
# 4. Log ها را بررسی کنید
# 5. ببینید به کجا redirect می‌شود
```

---

## 📋 چک لیست نهایی:

- [x] Documents - toUpperCase فیکس شد
- [x] Activities API - POST اضافه شد
- [ ] Tasks - نیاز به بررسی token
- [ ] Sales/New - نیاز به بررسی tenantKey
- [ ] Chat - نیاز به لاگین معتبر

---

## 💡 نکات مهم:

### 1. همیشه console.log اضافه کنید:
```typescript
console.log('🔍 Debug:', { tenantKey, token, data });
```

### 2. همیشه خطاها را catch کنید:
```typescript
try {
  // code
} catch (error) {
  console.error('Error:', error);
  toast({ title: "خطا", description: error.message });
}
```

### 3. همیشه قبل از redirect بررسی کنید:
```typescript
if (!tenantKey) {
  console.error('Tenant key is empty');
  return;
}
router.push(`/${tenantKey}/...`);
```

---

## 🎯 اولویت‌ها:

1. **فوری:** Activities API ✅ انجام شد
2. **فوری:** Documents toUpperCase ✅ انجام شد
3. **مهم:** Tasks redirect - نیاز به debug
4. **مهم:** Sales/New redirect - نیاز به debug
5. **عادی:** Chat - فقط نیاز به لاگین

---

## 🚀 مرحله بعد:

1. ریستارت سرور Next.js
2. لاگین مجدد
3. تست هر صفحه با Console باز
4. بررسی log ها
5. گزارش مشکلات باقیمانده

🎉 **تقریباً تمام!**
