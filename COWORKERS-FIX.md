# رفع مشکل افزودن همکار

## تاریخ: 1403/07/26 - ساعت 21:00

---

## ❌ مشکلات:

### 1. خطای customers-simple API
```
Error: Unknown column 'company' in 'field list'
```

**علت:** جدول customers ستون `company` ندارد، باید از `company_name` استفاده کرد.

### 2. API افزودن همکار وجود نداشت
```
POST /api/tenant/users
```

**علت:** فایل `app/api/tenant/users/route.ts` وجود نداشت.

---

## ✅ راه حل‌ها:

### 1. فیکس customers-simple API

**فایل:** `app/api/tenant/customers-simple/route.ts`

```typescript
// قبل:
SELECT id, name, email, phone, company 
FROM customers

// بعد:
SELECT id, name, email, phone, company_name as company 
FROM customers
```

---

### 2. ساخت API افزودن همکار

**فایل:** `app/api/tenant/users/route.ts`

**قابلیت‌ها:**
- ✅ بررسی احراز هویت
- ✅ بررسی مجوز (فقط ceo, admin, مدیر)
- ✅ Validation ورودی‌ها
- ✅ بررسی تکراری نبودن ایمیل
- ✅ Hash کردن رمز عبور با bcrypt
- ✅ ثبت کاربر جدید در دیتابیس

**فیلدهای الزامی:**
- name (نام کامل)
- email (ایمیل)
- password (رمز عبور)

**فیلدهای اختیاری:**
- role (نقش - پیش‌فرض: sales_agent)
- phone (تلفن)

**نقش‌های مجاز:**
- sales_agent (نماینده فروش)
- agent (نماینده)
- sales_manager (مدیر فروش)

---

## 📊 نحوه کار:

### 1. کاربر فرم را پر می‌کند:
```typescript
{
  name: "احمد رضایی",
  email: "ahmad@example.com",
  password: "123456",
  role: "sales_agent",
  phone: "09123456789"
}
```

### 2. درخواست به API ارسال می‌شود:
```typescript
POST /api/tenant/users
Headers:
  - X-Tenant-Key: rabin
  - Authorization: Bearer {token}
  - Content-Type: application/json
```

### 3. API بررسی‌ها را انجام می‌دهد:
- ✅ Tenant key معتبر است؟
- ✅ کاربر لاگین است؟
- ✅ کاربر مجوز دارد؟
- ✅ فیلدهای الزامی پر شده‌اند؟
- ✅ ایمیل تکراری نیست؟

### 4. رمز عبور hash می‌شود:
```typescript
const hashedPassword = await bcrypt.hash(password, 10);
```

### 5. کاربر در دیتابیس ثبت می‌شود:
```sql
INSERT INTO users (
  id, tenant_key, name, email, password, role, phone, 
  status, created_at, updated_at
) VALUES (UUID(), ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
```

### 6. پاسخ موفقیت برمی‌گردد:
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

---

## 🔒 امنیت:

### 1. احراز هویت:
- بررسی session
- بررسی token

### 2. مجوزدهی:
- فقط ceo, admin, مدیر می‌توانند همکار اضافه کنند

### 3. Validation:
- بررسی فیلدهای الزامی
- بررسی فرمت ایمیل
- بررسی تکراری نبودن ایمیل

### 4. رمز عبور:
- Hash شدن با bcrypt
- Salt rounds: 10

---

## 🧪 تست:

### 1. تست موفق:
```bash
# درخواست
POST /api/tenant/users
{
  "name": "تست کاربر",
  "email": "test@example.com",
  "password": "123456",
  "role": "sales_agent"
}

# پاسخ
{
  "success": true,
  "message": "همکار با موفقیت اضافه شد"
}
```

### 2. تست ایمیل تکراری:
```bash
# پاسخ
{
  "success": false,
  "message": "این ایمیل قبلاً ثبت شده است"
}
```

### 3. تست بدون مجوز:
```bash
# پاسخ
{
  "success": false,
  "message": "شما مجوز افزودن همکار ندارید"
}
```

### 4. تست فیلد خالی:
```bash
# پاسخ
{
  "success": false,
  "message": "نام، ایمیل و رمز عبور الزامی است"
}
```

---

## 📝 نکات مهم:

### 1. رمز عبور:
- حداقل 6 کاراکتر توصیه می‌شود
- Hash می‌شود قبل از ذخیره
- هرگز plain text ذخیره نمی‌شود

### 2. نقش‌ها:
- پیش‌فرض: sales_agent
- قابل تغییر توسط admin

### 3. وضعیت:
- پیش‌فرض: active
- می‌تواند inactive شود

### 4. Tenant Isolation:
- هر کاربر به یک tenant تعلق دارد
- tenant_key در تمام query ها استفاده می‌شود

---

## ✅ چک لیست:

- [x] API customers-simple فیکس شد
- [x] API افزودن همکار ساخته شد
- [x] احراز هویت پیاده شد
- [x] مجوزدهی پیاده شد
- [x] Validation پیاده شد
- [x] Hash رمز عبور پیاده شد
- [x] بررسی ایمیل تکراری پیاده شد
- [x] Tenant isolation پیاده شد

---

## 🚀 نتیجه:

**همه مشکلات برطرف شد!**

1. ✅ API customers-simple کار می‌کند
2. ✅ افزودن همکار کار می‌کند
3. ✅ امنیت رعایت شده
4. ✅ Validation انجام می‌شود

**لینک:** `http://localhost:3000/rabin/dashboard/coworkers`

🎉 **آماده استفاده!**
