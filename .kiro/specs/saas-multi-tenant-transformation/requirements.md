# Requirements Document

## Introduction

این پروژه هدف دارد سیستم CRM فعلی (با دستیار صوتی "صدای رابین") را به یک پلتفرم SaaS multi-tenant تبدیل کند. در این معماری، هر مشتری (tenant) دیتابیس جداگانه‌ای خواهد داشت و از طریق subdomain یا route اختصاصی به سیستم دسترسی پیدا می‌کند. پنل مدیریت موجود در `secret-zone-789` به یک داشبورد کامل SaaS برای مدیریت tenants، اشتراک‌ها و صورتحساب‌ها تبدیل خواهد شد.

**چالش اصلی:** اجتناب از تغییر ساختار ۷۰ جدول موجود در دیتابیس فعلی (مثل اضافه کردن `tenant_id` به همه جداول).

**رویکرد:** استفاده از معماری Multiple Databases - یک Master Database برای مدیریت tenants و یک دیتابیس جداگانه برای هر tenant.

## Requirements

### Requirement 1: Master Database برای مدیریت Tenants

**User Story:** به عنوان Super Admin، می‌خواهم یک دیتابیس مرکزی داشته باشم که اطلاعات تمام tenants، اشتراک‌ها و super admins را مدیریت کند، تا بتوانم به راحتی tenants جدید اضافه کنم و اشتراک‌ها را کنترل کنم.

#### Acceptance Criteria

1. WHEN سیستم راه‌اندازی می‌شود THEN یک دیتابیس `saas_master` با جداول زیر ایجاد شود:
   - `tenants`: شامل tenant_key, company_name, subdomain, db_name, db_user, db_password, subscription_status, subscription_plan, subscription_start, subscription_end, max_users, max_customers, max_storage_mb, features (JSON), settings (JSON), is_active, created_at, updated_at
   - `super_admins`: شامل username, email, password_hash, full_name, phone, role (super_admin/admin/support), permissions (JSON), is_active, last_login
   - `subscription_plans`: شامل plan_key, plan_name, price_monthly, price_yearly, max_users, max_customers, max_storage_mb, features (JSON), description
   - `subscription_history`: شامل tenant_id, plan_key, subscription_type, start_date, end_date, amount, status, notes
   - `tenant_activity_logs`: شامل tenant_id, activity_type, description, metadata (JSON), performed_by, ip_address, created_at

2. WHEN دیتابیس ایجاد می‌شود THEN باید از charset `utf8mb4` و collation `utf8mb4_unicode_ci` استفاده کند برای پشتیبانی کامل از زبان فارسی

3. WHEN دیتابیس ایجاد می‌شود THEN یک super admin پیش‌فرض با username `Ahmadreza.avandi` ایجاد شود

4. WHEN دیتابیس ایجاد می‌شود THEN سه پلن پیش‌فرض (basic, professional, enterprise) با قیمت‌ها و محدودیت‌های مشخص ایجاد شود

### Requirement 2: اتصال داینامیک به دیتابیس Tenant

**User Story:** به عنوان توسعه‌دهنده، می‌خواهم سیستم بتواند بر اساس subdomain یا route، به‌صورت خودکار به دیتابیس tenant مربوطه متصل شود، تا هر tenant فقط به داده‌های خودش دسترسی داشته باشد.

#### Acceptance Criteria

1. WHEN کاربر از طریق subdomain (مثل `rabin.crm.robintejarat.com`) یا route (مثل `/rabin/dashboard`) وارد می‌شود THEN middleware Next.js باید tenant_key را شناسایی کند

2. WHEN tenant_key شناسایی شد THEN سیستم باید از `saas_master` اطلاعات اتصال دیتابیس (db_name, db_user, db_password, db_host) را بخواند

3. WHEN اطلاعات اتصال دریافت شد THEN یک connection pool جدید به دیتابیس tenant ایجاد شود

4. IF tenant وجود نداشته باشد یا غیرفعال باشد THEN صفحه خطای مناسب (404 یا "اشتراک منقضی شده") نمایش داده شود

5. WHEN اشتراک tenant منقضی شده باشد (subscription_end < امروز) THEN دسترسی به سیستم مسدود شود و پیام "اشتراک شما منقضی شده است" نمایش داده شود

6. WHEN tenant به حداکثر تعداد کاربران یا مشتریان رسیده باشد THEN امکان افزودن کاربر یا مشتری جدید وجود نداشته باشد

### Requirement 3: ایجاد خودکار دیتابیس برای Tenant جدید

**User Story:** به عنوان Super Admin، می‌خواهم هنگام ثبت tenant جدید، دیتابیس اختصاصی با تمام جداول و ساختار لازم به‌صورت خودکار ایجاد شود، تا نیازی به کار دستی نداشته باشم.

#### Acceptance Criteria

1. WHEN Super Admin فرم ثبت tenant جدید را پر می‌کند (tenant_key, company_name, admin_email, plan) THEN یک دیتابیس جدید با نام `crm_tenant_{tenant_key}` ایجاد شود

2. WHEN دیتابیس جدید ایجاد می‌شود THEN تمام ۷۰ جدول موجود در `crm_system` (users, customers, deals, tasks, activities, documents, feedback, notifications, etc.) در دیتابیس جدید کپی شود

3. WHEN دیتابیس ایجاد شد THEN یک کاربر دیتابیس اختصاصی (`user_{tenant_key}`) با رمز عبور امن تصادفی ایجاد شود

4. WHEN کاربر دیتابیس ایجاد شد THEN اطلاعات اتصال (db_name, db_user, db_password) در جدول `tenants` در `saas_master` ذخیره شود

5. WHEN tenant ایجاد شد THEN یک کاربر admin پیش‌فرض در دیتابیس tenant با ایمیل و رمز عبور موقت ایجاد شود

6. WHEN tenant ایجاد شد THEN یک رکورد در `subscription_history` با جزئیات اشتراک اولیه ثبت شود

7. WHEN tenant ایجاد شد THEN یک لاگ در `tenant_activity_logs` با نوع "created" ثبت شود

8. IF خطایی در فرآیند ایجاد رخ دهد THEN تمام تغییرات rollback شود و پیام خطای مناسب نمایش داده شود

### Requirement 4: پنل مدیریت SaaS (ارتقای secret-zone-789)

**User Story:** به عنوان Super Admin، می‌خواهم یک پنل مدیریت کامل داشته باشم که بتوانم tenants را مدیریت کنم، اشتراک‌ها را تمدید یا لغو کنم، و گزارش‌های مالی مشاهده کنم.

#### Acceptance Criteria

1. WHEN Super Admin وارد `/secret-zone-789/admin-panel` می‌شود THEN صفحه لاگین با احراز هویت از `saas_master.super_admins` نمایش داده شود

2. WHEN Super Admin لاگین می‌کند THEN داشبورد با آمار کلی نمایش داده شود:
   - تعداد کل tenants
   - تعداد tenants فعال
   - تعداد tenants منقضی شده
   - تعداد tenants معلق
   - درآمد ماهانه
   - درآمد سالانه
   - نمودار رشد tenants
   - لیست tenants اخیر

3. WHEN Super Admin روی تب "مدیریت Tenants" کلیک می‌کند THEN لیست تمام tenants با فیلتر و جستجو نمایش داده شود

4. WHEN Super Admin روی دکمه "افزودن Tenant جدید" کلیک می‌کند THEN فرم ثبت tenant با فیلدهای زیر نمایش داده شود:
   - tenant_key (یکتا، فقط حروف انگلیسی کوچک و خط تیره، مثال: rabin, irankhodro)
   - company_name (نام شرکت به فارسی)
   - admin_name
   - admin_email
   - admin_phone
   - subscription_plan (انتخاب از لیست پلن‌ها)
   - subscription_months (تعداد ماه اشتراک)

5. WHEN فرم ثبت tenant ارسال می‌شود THEN سیستم باید:
   - اعتبارسنجی داده‌ها را انجام دهد (tenant_key فقط حروف انگلیسی کوچک و خط تیره)
   - بررسی کند tenant_key تکراری نباشد
   - دیتابیس جدید ایجاد کند
   - اطلاعات را در `saas_master` ذخیره کند
   - ایمیل خوش‌آمدگویی با URL دسترسی (`https://crm.robintejarat.com/{tenant_key}/login`) و اطلاعات لاگین به admin tenant ارسال کند
   - پیام موفقیت نمایش دهد

6. WHEN Super Admin روی یک tenant کلیک می‌کند THEN صفحه جزئیات tenant با اطلاعات زیر نمایش داده شود:
   - اطلاعات پایه (نام، ایمیل، تلفن)
   - وضعیت اشتراک
   - تاریخ شروع و پایان اشتراک
   - پلن فعلی
   - محدودیت‌ها (max_users, max_customers, max_storage_mb)
   - ویژگی‌های فعال
   - تاریخچه اشتراک‌ها
   - لاگ فعالیت‌ها
   - دکمه‌های عملیاتی (ویرایش، تعلیق، فعال‌سازی، حذف)

7. WHEN Super Admin روی دکمه "تمدید اشتراک" کلیک می‌کند THEN فرم تمدید با فیلدهای زیر نمایش داده شود:
   - انتخاب پلن جدید
   - تعداد ماه تمدید
   - مبلغ (محاسبه خودکار)
   - یادداشت

8. WHEN فرم تمدید ارسال می‌شود THEN سیستم باید:
   - تاریخ انقضا را به‌روزرسانی کند
   - رکورد جدید در `subscription_history` ایجاد کند
   - لاگ فعالیت ثبت کند
   - ایمیل تایید به admin tenant ارسال کند

9. WHEN Super Admin روی دکمه "تعلیق" کلیک می‌کند THEN وضعیت tenant به "suspended" تغییر کند و دسترسی tenant مسدود شود

10. WHEN Super Admin روی دکمه "حذف" کلیک می‌کند THEN یک تایید دریافت شود و در صورت تایید:
    - tenant به‌صورت soft delete علامت‌گذاری شود (is_deleted = true)
    - دیتابیس tenant حذف نشود (برای بازیابی احتمالی)
    - لاگ فعالیت ثبت شود

### Requirement 5: مدیریت اشتراک‌ها و پلن‌ها

**User Story:** به عنوان Super Admin، می‌خواهم بتوانم پلن‌های اشتراک را مدیریت کنم، قیمت‌ها را تغییر دهم، و ویژگی‌های هر پلن را تنظیم کنم.

#### Acceptance Criteria

1. WHEN Super Admin روی تب "مدیریت پلن‌ها" کلیک می‌کند THEN لیست تمام پلن‌های اشتراک نمایش داده شود

2. WHEN Super Admin روی دکمه "افزودن پلن جدید" کلیک می‌کند THEN فرم ایجاد پلن با فیلدهای زیر نمایش داده شود:
   - plan_key (یکتا)
   - plan_name (فارسی)
   - plan_name_en (انگلیسی)
   - price_monthly (تومان)
   - price_yearly (تومان)
   - max_users
   - max_customers
   - max_storage_mb
   - features (چک‌باکس‌های ویژگی‌ها: voice_assistant, advanced_reports, api_access, custom_integration, priority_support)
   - description

3. WHEN فرم پلن ارسال می‌شود THEN پلن جدید در `subscription_plans` ذخیره شود

4. WHEN Super Admin روی یک پلن کلیک می‌کند THEN بتواند قیمت‌ها، محدودیت‌ها و ویژگی‌ها را ویرایش کند

5. WHEN Super Admin یک پلن را غیرفعال می‌کند THEN پلن در لیست انتخاب برای tenants جدید نمایش داده نشود اما tenants فعلی تحت تاثیر قرار نگیرند

### Requirement 6: روت‌ها و Subdomain برای Tenants

**User Story:** به عنوان Tenant Admin، می‌خواهم از طریق یک route اختصاصی (مثل `https://crm.robintejarat.com/rabin/dashboard`) به CRM دسترسی داشته باشم.

#### Acceptance Criteria

1. WHEN tenant از طریق route `https://crm.robintejarat.com/[tenant_key]/dashboard` وارد می‌شود THEN به صفحه داشبورد CRM هدایت شود

2. WHEN tenant از طریق route `https://crm.robintejarat.com/[tenant_key]/login` وارد می‌شود THEN به صفحه لاگین CRM هدایت شود

3. WHEN tenant لاگین می‌کند THEN session او فقط برای tenant_key مربوطه معتبر باشد

4. WHEN tenant به route دیگری (مثل `/customers`, `/deals`, `/tasks`) دسترسی پیدا می‌کند THEN همه route‌ها باید prefix `/[tenant_key]` داشته باشند (مثل `/rabin/customers`, `/rabin/deals`)

5. WHEN middleware اجرا می‌شود THEN باید tenant_key را از URL path استخراج کند (نه از subdomain)

6. WHEN دستیار صوتی (Rabin Voice) فراخوانی می‌شود THEN باید tenant_key را از URL path دریافت کند و فقط به داده‌های آن tenant دسترسی داشته باشد

### Requirement 7: ایزولاسیون دستیار صوتی (Rabin Voice)

**User Story:** به عنوان Tenant، می‌خواهم دستیار صوتی فقط به داده‌های شرکت من دسترسی داشته باشد و نتواند اطلاعات سایر tenants را ببیند.

#### Acceptance Criteria

1. WHEN tenant از دستیار صوتی استفاده می‌کند THEN API `/rabin-voice/api/ai` باید tenant_key را از header یا session دریافت کند

2. WHEN دستیار صوتی به دیتابیس متصل می‌شود THEN باید به دیتابیس tenant مربوطه متصل شود نه `crm_system` اصلی

3. WHEN دستیار صوتی query می‌زند THEN فقط داده‌های tenant فعلی را برگرداند

4. IF tenant ویژگی `voice_assistant` را در پلن خود نداشته باشد THEN دسترسی به دستیار صوتی مسدود شود

5. WHEN دستیار صوتی لاگ می‌کند THEN لاگ‌ها باید شامل tenant_key باشند برای debugging

### Requirement 8: امنیت و اعتبارسنجی

**User Story:** به عنوان توسعه‌دهنده، می‌خواهم اطمینان حاصل کنم که هیچ tenant نمی‌تواند به داده‌های tenant دیگری دسترسی پیدا کند.

#### Acceptance Criteria

1. WHEN middleware اجرا می‌شود THEN باید tenant_key را از URL یا subdomain استخراج کند و اعتبارسنجی کند

2. WHEN tenant_key نامعتبر باشد THEN درخواست با خطای 404 رد شود

3. WHEN کاربر سعی کند به tenant دیگری دسترسی پیدا کند THEN session او invalid شود و به صفحه لاگین هدایت شود

4. WHEN Super Admin به پنل مدیریت دسترسی پیدا می‌کند THEN باید از JWT token با expiration کوتاه (1 ساعت) استفاده شود

5. WHEN رمز عبور دیتابیس tenant در `saas_master` ذخیره می‌شود THEN باید encrypt شود (مثلا با AES-256)

6. WHEN اسکریپت ایجاد دیتابیس اجرا می‌شود THEN باید از SQL injection محافظت شود

### Requirement 9: اسکریپت‌های خودکارسازی

**User Story:** به عنوان DevOps، می‌خواهم اسکریپت‌هایی داشته باشم که فرآیند ایجاد tenant، backup و مدیریت دیتابیس را خودکار کنند.

#### Acceptance Criteria

1. WHEN اسکریپت `create-tenant-database.js` اجرا می‌شود THEN باید:
   - دیتابیس جدید ایجاد کند
   - ساختار جداول را از template کپی کند
   - کاربر دیتابیس ایجاد کند
   - اطلاعات را در `saas_master` ذخیره کند
   - لاگ کامل از عملیات ثبت کند

2. WHEN اسکریپت `backup-tenant-database.sh` اجرا می‌شود THEN باید:
   - backup از دیتابیس tenant بگیرد
   - فایل backup را با نام `{tenant_key}_{date}.sql` ذخیره کند
   - backup قدیمی‌تر از 30 روز را حذف کند

3. WHEN اسکریپت `check-expired-subscriptions.js` اجرا می‌شود (cron job روزانه) THEN باید:
   - tenants با اشتراک منقضی شده را پیدا کند
   - وضعیت آن‌ها را به "expired" تغییر دهد
   - ایمیل اطلاع‌رسانی به admin tenant ارسال کند
   - لاگ فعالیت ثبت کند

4. WHEN اسکریپت `migrate-tenant-database.js` اجرا می‌شود THEN باید:
   - migration را روی تمام دیتابیس‌های tenant اجرا کند
   - در صورت خطا، rollback کند
   - گزارش نتیجه را ثبت کند

### Requirement 10: مستندسازی و راهنما

**User Story:** به عنوان توسعه‌دهنده یا Super Admin، می‌خواهم مستندات کاملی از معماری، API‌ها و فرآیندها داشته باشم.

#### Acceptance Criteria

1. WHEN پروژه تحویل داده می‌شود THEN باید شامل فایل‌های زیر باشد:
   - `SAAS_ARCHITECTURE.md`: توضیح معماری multi-tenant
   - `ADMIN_PANEL_GUIDE.md`: راهنمای استفاده از پنل مدیریت
   - `TENANT_SETUP_GUIDE.md`: راهنمای راه‌اندازی tenant جدید
   - `API_DOCUMENTATION.md`: مستندات API‌های SaaS
   - `DEPLOYMENT_GUIDE.md`: راهنمای deploy با Docker
   - `TROUBLESHOOTING.md`: راهنمای عیب‌یابی

2. WHEN مستندات نوشته می‌شود THEN باید شامل:
   - دیاگرام‌های معماری (Mermaid)
   - مثال‌های کد
   - اسکرین‌شات‌های رابط کاربری
   - دستورات CLI
   - نکات امنیتی

3. WHEN کد نوشته می‌شود THEN باید شامل comment‌های فارسی برای توضیح منطق پیچیده باشد

---

## خلاصه نیازمندی‌ها

این سند شامل 10 requirement اصلی است که پروژه تبدیل CRM به SaaS multi-tenant را پوشش می‌دهد:

1. Master Database برای مدیریت Tenants
2. اتصال داینامیک به دیتابیس Tenant
3. ایجاد خودکار دیتابیس برای Tenant جدید
4. پنل مدیریت SaaS (ارتقای secret-zone-789)
5. مدیریت اشتراک‌ها و پلن‌ها
6. روت‌ها و Subdomain برای Tenants
7. ایزولاسیون دستیار صوتی (Rabin Voice)
8. امنیت و اعتبارسنجی
9. اسکریپت‌های خودکارسازی
10. مستندسازی و راهنما

هر requirement شامل user story و acceptance criteria دقیق در فرمت EARS است.
