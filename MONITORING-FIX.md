# رفع مشکل صفحه مانیتورینگ

## تاریخ: 1403/07/26

---

## مشکلات یافت شده:

### ❌ 1. جدول feedback - ستون rating
**خطا:** `Unknown column 'rating' in 'field list'`
**علت:** جدول feedback ستون `rating` ندارد، باید از `score` استفاده کرد
**راه حل:** ✅ فیکس شد - تغییر query به استفاده از `score`

### ❌ 2. جدول contacts - ستون customer_id  
**خطا:** `Unknown column 'customer_id' in 'where clause'`
**علت:** جدول contacts از `company_id` استفاده می‌کند نه `customer_id`
**راه حل:** ✅ فیکس شد - تغییر در `app/api/tenant/customers/[id]/route.ts`

---

## تغییرات انجام شده:

### 1. فایل: `app/api/tenant/monitoring/route.ts`
```typescript
// قبل:
SELECT rating, COUNT(*) as count FROM feedback

// بعد:
SELECT COALESCE(score, 0) as rating, COUNT(*) as count FROM feedback
```

### 2. فایل: `app/api/tenant/customers/[id]/route.ts`
```typescript
// قبل:
WHERE customer_id = ? AND tenant_key = ?

// بعد:
WHERE company_id = ? AND tenant_key = ?
```

### 3. فایل: `app/[tenant_key]/dashboard/system-monitoring/page.tsx`
- اضافه کردن دکمه "تلاش مجدد" در حالت عدم وجود داده

---

## نتایج تست:

### ✅ داده‌های موجود:
- فروش ماهانه: 1 ماه (10 فروش)
- فروش هفتگی: 2 هفته
- وضعیت پرداخت: 2 وضعیت (9 pending, 1 paid)
- برترین مشتریان: 10 مشتری
- رضایت مشتریان: 0 (هیچ مشتری با امتیاز رضایت)
- فروشندگان برتر: داده موجود

### ⚠️ داده‌های ناقص:
- **رضایت مشتریان:** هیچ مشتری با `satisfaction_score` وجود ندارد
- **بازخوردها:** باید بررسی شود که جدول feedback داده دارد یا نه

---

## توصیه‌ها:

### 1. اضافه کردن داده نمونه برای رضایت:
```sql
UPDATE customers 
SET satisfaction_score = FLOOR(3 + (RAND() * 2))
WHERE tenant_key = 'rabin' 
LIMIT 50;
```

### 2. بررسی جدول feedback:
```sql
SELECT COUNT(*) FROM feedback WHERE tenant_key = 'rabin';
```

### 3. اگر feedback خالی است، اضافه کردن داده نمونه:
```sql
INSERT INTO feedback (id, tenant_key, customer_id, score, message, created_at)
SELECT 
  UUID(),
  'rabin',
  id,
  FLOOR(1 + (RAND() * 5)),
  'بازخورد نمونه',
  NOW()
FROM customers 
WHERE tenant_key = 'rabin'
LIMIT 20;
```

---

## مراحل تست:

1. **ریستارت سرور Next.js**
   ```bash
   # Ctrl+C
   npm run dev
   ```

2. **مراجعه به صفحه مانیتورینگ**
   ```
   http://localhost:3000/rabin/dashboard/system-monitoring
   ```

3. **بررسی Console برای خطاها**
   - F12 → Console
   - F12 → Network → فیلتر: monitoring

4. **اگر "داده‌ای یافت نشد" نمایش داده شد:**
   - کلیک روی "تلاش مجدد"
   - بررسی Console برای خطای دقیق
   - بررسی Network tab برای response

---

## خطاهای احتمالی:

### 1. خطای 401 (Unauthorized)
**علت:** مشکل authentication
**راه حل:** 
- لاگین مجدد
- پاک کردن cookie ها
- بررسی token در localStorage

### 2. خطای 500 (Internal Server Error)
**علت:** مشکل در query های دیتابیس
**راه حل:**
- بررسی console سرور
- بررسی ساختار جداول
- اجرای اسکریپت تست: `node scripts/test-monitoring-api.cjs`

### 3. داده‌ای یافت نشد (اما بدون خطا)
**علت:** response خالی یا null
**راه حل:**
- بررسی Network tab
- بررسی response.data
- اضافه کردن console.log در کد

---

## وضعیت نهایی:

✅ **API فیکس شد**
✅ **خطاهای دیتابیس برطرف شد**
✅ **صفحه آماده نمایش است**

⚠️ **نیاز به داده بیشتر:**
- رضایت مشتریان (satisfaction_score)
- بازخوردها (feedback)

---

## دستورات مفید:

### تست API از طریق اسکریپت:
```bash
node scripts/test-monitoring-api.cjs
```

### بررسی ساختار جداول:
```bash
node scripts/check-feedback-structure.cjs
node scripts/check-contacts-structure.cjs
```

### اضافه کردن داده نمونه:
```bash
# اجرای SQL های بالا در MySQL
```

---

## نتیجه:

صفحه مانیتورینگ آماده است و باید کار کند. اگر "داده‌ای یافت نشد" نمایش می‌دهد:
1. Console را چک کنید
2. Network tab را بررسی کنید  
3. اسکریپت تست را اجرا کنید
4. داده نمونه اضافه کنید

🎉 **آماده استفاده!**
