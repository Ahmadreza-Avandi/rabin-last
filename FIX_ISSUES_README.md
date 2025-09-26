# راهنمای حل مشکلات سیستم CRM

## مشکلات شناسایی شده و راه حل‌ها

### 1. مشکل Feedback API
**خطا:** `Unknown column 'f.assigned_to' in 'on clause'`

**راه حل:** 
- ستون `assigned_to` به جدول `feedback` اضافه شد
- کوئری‌های API اصلاح شدند

### 2. مشکل Activities API  
**خطا:** `LIMIT 20 OFFSET -20`

**راه حل:**
- محاسبه offset اصلاح شد تا همیشه مثبت باشد
- `Math.max(0, (page - 1) * limit)` استفاده شد

### 3. مشکل Sales API
**خطا:** `Cannot read properties of undefined (reading 'length')`

**راه حل:**
- بررسی وجود آرایه `sales` قبل از پردازش
- مدیریت بهتر خطاها

### 4. مشکل Calendar (تاریخ فارسی)
**خطا:** تبدیل نادرست تاریخ فارسی به میلادی

**راه حل:**
- استفاده از `moment().jYear().jMonth().jDate()` به جای `moment(date, 'jYYYY/jMM/jDD')`
- پارس کردن دستی تاریخ فارسی

### 5. مشکل System Monitoring
**خطا:** کوئری‌های نادرست برای آمار سیستم

**راه حل:**
- اصلاح کوئری‌های دیتابیس
- استفاده از ستون‌های صحیح

## نحوه اجرای تعمیرات

### روش 1: استفاده از اسکریپت PowerShell (ویندوز)
```powershell
.\fix-all-database-issues.ps1
```

### روش 2: استفاده از اسکریپت Bash (لینوکس/مک)
```bash
./fix-all-database-issues.sh
```

### روش 3: اجرای دستی SQL
```bash
mysql -u root -p crm_system < fix-all-issues.sql
```

## تغییرات اعمال شده

### 1. جداول جدید
- `sales_pipeline_stages`: مراحل فرآیند فروش
- `users`: کاربران سیستم (اگر وجود نداشت)
- `products`: محصولات (اگر وجود نداشت)

### 2. ستون‌های جدید
- `feedback.assigned_to`: کاربر مسئول بازخورد
- `feedback.resolved_by`: کاربر حل‌کننده بازخورد  
- `feedback.resolved_at`: زمان حل بازخورد

### 3. ویوهای جدید
- `daily_interaction_stats`: آمار روزانه تعاملات
- `interaction_summary`: خلاصه تعاملات
- `sales_pipeline_report`: گزارش فرآیند فروش
- `sales_statistics`: آمار فروش

### 4. ایندکس‌های جدید
- بهبود عملکرد کوئری‌ها
- ایندکس روی ستون‌های پرکاربرد

## بررسی عملکرد

بعد از اجرای تعمیرات، موارد زیر را بررسی کنید:

### 1. Feedback Module
- برو به `http://localhost:3000/dashboard/feedback`
- باید لیست بازخوردها نمایش داده شود
- فیلترهای تاریخ باید کار کنند

### 2. Activities Module  
- برو به `http://localhost:3000/dashboard/activities`
- باید لیست فعالیت‌ها نمایش داده شود
- صفحه‌بندی باید درست کار کند

### 3. Sales Module
- برو به `http://localhost:3000/dashboard/sales`
- باید داده‌های فروش نمایش داده شود
- ایجاد فروش جدید باید کار کند

### 4. Calendar Module
- برو به `http://localhost:3000/dashboard/calendar`
- تقویم فارسی باید نمایش داده شود
- ایجاد رویداد جدید باید کار کند

### 5. System Monitoring
- برو به `http://localhost:3000/dashboard/system-monitoring`
- آمار سیستم باید از دیتابیس خوانده شود

## عیب‌یابی

### اگر هنوز خطا دارید:

1. **بررسی اتصال دیتابیس:**
```bash
mysql -u root -p -e "SELECT 1;" crm_system
```

2. **بررسی وجود جداول:**
```sql
SHOW TABLES;
```

3. **بررسی ساختار جداول:**
```sql
DESCRIBE feedback;
DESCRIBE activities;
DESCRIBE sales;
```

4. **بررسی لاگ‌های سرور:**
```bash
npm run dev
```

### خطاهای رایج:

1. **"Table doesn't exist"**
   - اسکریپت SQL را مجدداً اجرا کنید
   - بررسی کنید دیتابیس درست انتخاب شده

2. **"Column doesn't exist"**  
   - ALTER TABLE کوئری‌ها را مجدداً اجرا کنید
   - بررسی کنید ستون‌ها اضافه شده‌اند

3. **"Access denied"**
   - بررسی کنید کاربر دیتابیس مجوزهای لازم را دارد
   - رمز عبور را بررسی کنید

## پشتیبانی

اگر مشکلی باقی ماند:
1. لاگ‌های کامل خطا را بررسی کنید
2. فایل `.env.local` را بررسی کنید  
3. اتصال دیتابیس را تست کنید
4. نسخه Node.js و MySQL را بررسی کنید

## نکات مهم

- قبل از اجرای تعمیرات، حتماً بک‌آپ از دیتابیس بگیرید
- بعد از تعمیرات، سرور را restart کنید
- کش مرورگر را پاک کنید
- در صورت نیاز، `node_modules` را پاک کرده و `npm install` کنید