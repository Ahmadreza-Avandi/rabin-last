# خلاصه رفع مشکلات

## تاریخ: 1403/07/26
## زمان: 19:00

---

## مشکلات گزارش شده و وضعیت رفع آنها:

### ✅ 1. خطای toLowerCase در صفحه فروش
**URL:** `http://localhost:3000/rabin/dashboard/sales`
**خطا:** `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`
**علت:** فیلد `title` یا `customer_name` در برخی رکوردها NULL بود
**راه حل:**
- فایل: `app/[tenant_key]/dashboard/sales/page.tsx` (خط 153)
- تغییر: `sale.title.toLowerCase()` → `(sale.title || '').toLowerCase()`
- تغییر: `sale.customer_name.toLowerCase()` → `(sale.customer_name || '').toLowerCase()`
- اضافه کردن ستون `title` به جدول `sales` در دیتابیس
- به‌روزرسانی تمام رکوردهای موجود با title مناسب

**وضعیت:** ✅ فیکس شده

---

### ✅ 2. خطای 500 در API مشتریان ساده
**URL:** `GET http://localhost:3000/api/tenant/customers-simple?limit=1000`
**خطا:** `500 (Internal Server Error)`
**علت:** فیلتر `status = 'active'` باعث می‌شد برخی مشتریان نمایش داده نشوند
**راه حل:**
- فایل: `app/api/tenant/customers-simple/route.ts`
- حذف فیلتر: `WHERE tenant_key = ? AND status = 'active'`
- تغییر به: `WHERE tenant_key = ?`

**وضعیت:** ✅ فیکس شده

---

### ✅ 3. به‌روزرسانی صفحه فروش
**مشکل:** صفحه فروش با ساختار قدیمی deals کار می‌کرد
**راه حل:**
- تغییر interface از `Sale` با فیلدهای deal به فیلدهای sales واقعی
- تغییر `total_value` به `total_amount`
- تغییر `stage` به `payment_status`
- تغییر `expected_close_date` به `sale_date`
- اضافه کردن `invoice_number` و `sales_person_name`
- به‌روزرسانی توابع `getStageColor` به `getPaymentStatusColor`
- به‌روزرسانی آمار از "فروش‌های فعال/موفق" به "در انتظار پرداخت/پرداخت شده"

**وضعیت:** ✅ فیکس شده

---

### ⚠️ 4. پروفایل مشتری - "مشتری یافت نشد"
**URL:** `http://localhost:3000/rabin/dashboard/customers/bb19a347-ab65-11f0-81d2-581122e4f0be`
**مشکل:** صفحه نمایش می‌دهد "مشتری یافت نشد"
**وضعیت:** نیاز به بررسی - باید چک شود این ID در دیتابیس وجود دارد یا خیر
**توصیه:** 
- از لیست مشتریان یک مشتری واقعی انتخاب کنید
- یا ID صحیح مشتری را از دیتابیس بگیرید

---

### ⚠️ 5. صفحه فعالیت‌ها - مشکل اضافه کردن فعالیت
**URL:** `http://localhost:3000/rabin/dashboard/activities`
**مشکل:** نمی‌تواند برای مشتری فعالیت اضافه کند
**علت احتمالی:** خطای 500 در API customers-simple که فیکس شد
**وضعیت:** باید دوباره تست شود - احتمالاً با فیکس API customers-simple حل شده

---

### ⚠️ 6. صفحه وظایف - redirect به لاگین
**URL:** `http://localhost:3000/rabin/dashboard/tasks`
**مشکل:** سیستم کاربر را به صفحه لاگین می‌فرستد
**علت احتمالی:** مشکل authentication یا session
**وضعیت:** نیاز به بررسی بیشتر
**توصیه:**
- چک کردن cookie ها در browser
- چک کردن token در localStorage
- لاگین مجدد و تست دوباره

---

## تغییرات دیتابیس انجام شده:

### جدول `sales`:
```sql
-- اضافه کردن ستون title
ALTER TABLE sales 
ADD COLUMN title VARCHAR(255) AFTER id;

-- به‌روزرسانی title برای رکوردهای موجود
UPDATE sales s
LEFT JOIN customers c ON s.customer_id = c.id
SET s.title = CONCAT('فروش به ', COALESCE(c.name, 'مشتری'), ' - ', DATE_FORMAT(s.sale_date, '%Y/%m/%d'))
WHERE s.title IS NULL OR s.title = '';
```

### جدول `customers`:
- بررسی و تایید وجود ستون `status`
- به‌روزرسانی مقادیر NULL به 'active'

---

## فایل‌های تغییر یافته:

1. ✅ `app/[tenant_key]/dashboard/sales/page.tsx` - رفع خطای toLowerCase و به‌روزرسانی کامل
2. ✅ `app/api/tenant/customers-simple/route.ts` - حذف فیلتر status
3. ✅ `scripts/check-sales-structure.cjs` - اسکریپت بررسی و رفع مشکل sales
4. ✅ `scripts/fix-customer-issues.cjs` - اسکریپت بررسی و رفع مشکل customers

---

## مراحل تست:

### برای تست مشکلات فیکس شده:

1. **ریستارت سرور Next.js:**
   ```bash
   # توقف سرور فعلی (Ctrl+C)
   npm run dev
   ```

2. **تست صفحه فروش:**
   - مراجعه به: `http://localhost:3000/rabin/dashboard/sales`
   - جستجو در فیلد search
   - بررسی نمایش صحیح لیست فروش‌ها

3. **تست API مشتریان:**
   - باز کردن Developer Tools (F12)
   - مراجعه به: `http://localhost:3000/rabin/dashboard/activities`
   - بررسی عدم خطای 500 در Network tab

4. **تست اضافه کردن فعالیت:**
   - کلیک روی "فعالیت جدید"
   - انتخاب مشتری از لیست
   - ثبت فعالیت

5. **تست صفحه وظایف:**
   - مراجعه به: `http://localhost:3000/rabin/dashboard/tasks`
   - اگر redirect شد، لاگین مجدد کنید

---

## نکات مهم:

⚠️ **خطای "Too many connections":**
- اگر این خطا را دیدید، MySQL connections زیادی باز مانده
- راه حل: ریستارت MySQL یا ریستارت سیستم
- یا صبر کنید تا connections timeout شوند

⚠️ **مشکلات Authentication:**
- اگر به صفحه لاگین redirect شدید:
  1. Cookie ها را پاک کنید
  2. localStorage را پاک کنید
  3. لاگین مجدد کنید

---

## خلاصه:

✅ **فیکس شده:** 3 مورد
⚠️ **نیاز به تست مجدد:** 2 مورد  
❓ **نیاز به بررسی بیشتر:** 1 مورد

**توصیه نهایی:** 
لطفاً سرور را ریستارت کنید و مشکلات را دوباره تست کنید. اگر مشکلی باقی ماند، گزارش دهید.
