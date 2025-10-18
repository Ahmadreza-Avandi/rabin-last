# تکمیل API کاربران

## تاریخ: 1403/07/26 - ساعت 21:15

---

## ❌ مشکل:

```
GET http://localhost:3000/api/tenant/users 405 (Method Not Allowed)
Error fetching users: SyntaxError: Failed to execute 'json' on 'Response'
```

**علت:** API فقط متد POST داشت، اما صفحه coworkers با GET لیست کاربران را درخواست می‌کرد.

---

## ✅ راه حل:

اضافه کردن متد GET به API

**فایل:** `app/api/tenant/users/route.ts`

---

## 📊 API کامل:

### 1. GET - دریافت لیست کاربران

**درخواست:**
```
GET /api/tenant/users
Headers:
  - X-Tenant-Key: rabin
  - Authorization: Bearer {token}
```

**پاسخ:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "احمد رضایی",
      "email": "ahmad@example.com",
      "role": "sales_agent",
      "phone": "09123456789",
      "status": "active",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**ویژگی‌ها:**
- ✅ احراز هویت
- ✅ Tenant isolation
- ✅ مرتب‌سازی بر اساس تاریخ ایجاد
- ✅ فیلدهای امن (بدون password)

---

### 2. POST - افزودن کاربر جدید

**درخواست:**
```
POST /api/tenant/users
Headers:
  - X-Tenant-Key: rabin
  - Authorization: Bearer {token}
  - Content-Type: application/json

Body:
{
  "name": "احمد رضایی",
  "email": "ahmad@example.com",
  "password": "123456",
  "role": "sales_agent",
  "phone": "09123456789"
}
```

**پاسخ:**
```json
{
  "success": true,
  "message": "همکار با موفقیت اضافه شد",
  "data": {
    "id": "...",
    "name": "احمد رضایی",
    "email": "ahmad@example.com",
    "role": "sales_agent"
  }
}
```

**ویژگی‌ها:**
- ✅ احراز هویت
- ✅ مجوزدهی (فقط ceo, admin, مدیر)
- ✅ Validation
- ✅ بررسی ایمیل تکراری
- ✅ Hash رمز عبور
- ✅ Tenant isolation

---

## 🔒 امنیت:

### GET:
- ✅ احراز هویت
- ✅ Tenant isolation
- ✅ فیلدهای امن (password برنمی‌گردد)

### POST:
- ✅ احراز هویت
- ✅ مجوزدهی
- ✅ Validation
- ✅ Hash password
- ✅ بررسی ایمیل تکراری

---

## 📝 فیلدهای برگشتی (GET):

```typescript
{
  id: string;           // شناسه کاربر
  name: string;         // نام کامل
  email: string;        // ایمیل
  role: string;         // نقش
  phone: string | null; // تلفن
  status: string;       // وضعیت (active/inactive)
  created_at: Date;     // تاریخ ایجاد
}
```

**توجه:** فیلد `password` برای امنیت برنمی‌گردد.

---

## 🧪 تست:

### 1. دریافت لیست کاربران:
```bash
curl -X GET http://localhost:3000/api/tenant/users \
  -H "X-Tenant-Key: rabin" \
  -H "Authorization: Bearer {token}"
```

### 2. افزودن کاربر جدید:
```bash
curl -X POST http://localhost:3000/api/tenant/users \
  -H "X-Tenant-Key: rabin" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "تست کاربر",
    "email": "test@example.com",
    "password": "123456",
    "role": "sales_agent"
  }'
```

---

## ✅ چک لیست:

- [x] متد GET اضافه شد
- [x] متد POST موجود است
- [x] احراز هویت در هر دو متد
- [x] Tenant isolation در هر دو متد
- [x] فیلدهای امن برمی‌گردند
- [x] خطای TypeScript فیکس شد
- [x] بدون خطای syntax

---

## 🎯 نتیجه:

**API کاربران کامل شد!**

- ✅ GET: دریافت لیست کاربران
- ✅ POST: افزودن کاربر جدید
- ✅ امنیت کامل
- ✅ Validation کامل

**لینک:** `http://localhost:3000/rabin/dashboard/coworkers`

🎉 **آماده استفاده!**
