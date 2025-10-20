# Implementation Plan

این پلن شامل تسک‌های کدنویسی برای تبدیل CRM به سیستم SaaS multi-tenant است. هر تسک به‌صورت incremental و قابل تست طراحی شده است.

## فاز 1: راه‌اندازی Master Database

- [x] 1. ایجاد و راه‌اندازی Master Database



  - ایجاد فایل SQL schema کامل برای `saas_master` با جداول tenants, super_admins, subscription_plans, subscription_history, tenant_activity_logs
  - اضافه کردن indexes مناسب برای بهبود performance
  - اضافه کردن data پیش‌فرض: یک super admin و سه subscription plan (basic, professional, enterprise)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. ایجاد اسکریپت راه‌اندازی اولیه

  - نوشتن اسکریپت Node.js برای ایجاد دیتابیس `saas_master` در MySQL
  - اضافه کردن قابلیت hash کردن password برای super admin پیش‌فرض
  - تست اجرای اسکریپت و بررسی ایجاد صحیح جداول
  - _Requirements: 1.1, 1.3_

- [x] 3. ایجاد connection helper برای Master Database

  - نوشتن `lib/master-database.ts` با توابع اتصال به `saas_master`
  - پیاده‌سازی connection pool برای Master DB
  - اضافه کردن error handling و retry logic
  - تست اتصال و query ساده
  - _Requirements: 1.1, 2.2_

## فاز 2: پیاده‌سازی Middleware و Tenant Detection

- [x] 4. ایجاد Middleware برای Tenant Detection



  - نوشتن `middleware.ts` در root پروژه
  - پیاده‌سازی تابع `extractTenantKey` برای استخراج tenant_key از URL path
  - پیاده‌سازی تابع `isValidTenantKey` برای اعتبارسنجی فرمت tenant_key (فقط حروف کوچک، اعداد، خط تیره)
  - اضافه کردن logic برای skip کردن routes خاص (secret-zone-789, api, _next, static)
  - _Requirements: 2.1, 6.1, 6.5, 8.1, 8.2_

- [x] 5. پیاده‌سازی Tenant Info Lookup


  - نوشتن تابع `getTenantInfo` در middleware برای query کردن اطلاعات tenant از `saas_master`
  - پیاده‌سازی بررسی وضعیت اشتراک (active, expired, suspended)
  - پیاده‌سازی redirect به صفحات خطای مناسب (404, subscription-expired, account-suspended)
  - اضافه کردن tenant info به request headers (X-Tenant-Key, X-Tenant-DB)
  - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [x] 6. ایجاد صفحات خطا برای Tenants

  - ایجاد `app/[tenant_key]/subscription-expired/page.tsx` با پیام فارسی
  - ایجاد `app/[tenant_key]/account-suspended/page.tsx` با پیام فارسی
  - ایجاد `app/tenant-not-found/page.tsx`
  - استایل دهی با Tailwind CSS مشابه سایر صفحات
  - _Requirements: 2.4, 2.5_

- [ ]* 6.1 نوشتن unit tests برای middleware
  - تست استخراج tenant_key از URL های مختلف
  - تست اعتبارسنجی tenant_key (valid/invalid formats)
  - تست redirect برای tenant نامعتبر یا منقضی شده
  - _Requirements: 2.1, 8.1, 8.2_

## فاز 3: Dynamic Database Connection


- [x] 7. پیاده‌سازی Tenant Database Connection Manager

  - نوشتن `lib/tenant-database.ts` با تابع `getTenantConnection`
  - پیاده‌سازی connection pool caching برای هر tenant (استفاده از Map)
  - پیاده‌سازی تابع `getTenantConfigFromMaster` برای خواندن اطلاعات اتصال
  - اضافه کردن error handling برای connection failures
  - _Requirements: 2.2, 2.3_

- [x] 8. پیاده‌سازی Password Encryption/Decryption


  - نوشتن `lib/encryption.ts` با توابع `encryptPassword` و `decryptPassword`
  - استفاده از AES-256-GCM برای encryption
  - اضافه کردن environment variable `DB_ENCRYPTION_KEY` به `.env`
  - تست encryption/decryption با password نمونه
  - _Requirements: 8.5_


- [x] 9. پیاده‌سازی Tenant Context Provider

  - نوشتن `lib/tenant-context.ts` برای مدیریت tenant context در application
  - ایجاد React Context برای دسترسی به tenant_key در components
  - پیاده‌سازی hook `useTenant` برای استفاده در components
  - _Requirements: 2.1, 6.3_

- [ ]* 9.1 نوشتن unit tests برای database connection
  - تست ایجاد connection pool
  - تست caching connection pool
  - تست decrypt کردن password
  - تست error handling برای connection failure
  - _Requirements: 2.2, 2.3, 8.5_

## فاز 4: اسکریپت ایجاد Tenant Database


- [x] 10. ایجاد Template SQL برای Tenant Database



  - export کردن ساختار دیتابیس فعلی `crm_system` به فایل `database/tenant-template.sql`
  - حذف data نمونه و فقط نگه داشتن ساختار جداول (CREATE TABLE statements)
  - اطمینان از charset utf8mb4 و collation utf8mb4_unicode_ci
  - _Requirements: 3.2_


- [x] 11. نوشتن اسکریپت ایجاد Tenant Database

  - ایجاد `scripts/create-tenant-database.js`
  - پیاده‌سازی تابع `createTenantDatabase` که:
    - دیتابیس جدید با نام `crm_tenant_{tenant_key}` ایجاد کند
    - ساختار جداول را از template کپی کند
    - کاربر دیتابیس اختصاصی `user_{tenant_key}` با password تصادفی ایجاد کند
    - اطلاعات اتصال را encrypt کرده و در `saas_master.tenants` ذخیره کند
  - اضافه کردن transaction برای rollback در صورت خطا
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.8_


- [x] 12. ایجاد کاربر Admin پیش‌فرض در Tenant Database
  - اضافه کردن logic به اسکریپت برای ایجاد یک کاربر admin در جدول `users` دیتابیس tenant
  - generate کردن password موقت و hash کردن آن
  - ذخیره اطلاعات کاربر (email از admin_email tenant)
  - _Requirements: 3.5_


- [x] 13. ثبت Subscription History و Activity Log

  - اضافه کردن رکورد در `subscription_history` با جزئیات اشتراک اولیه
  - اضافه کردن رکورد در `tenant_activity_logs` با نوع "created"
  - _Requirements: 3.6, 3.7_

- [ ]* 13.1 نوشتن integration test برای ایجاد tenant
  - تست end-to-end ایجاد tenant جدید
  - بررسی ایجاد دیتابیس
  - بررسی ایجاد کاربر دیتابیس
  - بررسی ثبت اطلاعات در master database
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_


## فاز 5: ارتقای Admin Panel (secret-zone-789)

- [x] 14. اتصال Admin Panel به Master Database
  - به‌روزرسانی `app/secret-zone-789/admin-panel/page.tsx` برای استفاده از API واقعی به جای mock data
  - حذف MOCK_CUSTOMERS و MOCK_STATS
  - پیاده‌سازی fetch از API endpoints
  - _Requirements: 4.1, 4.2_

- [x] 15. پیاده‌سازی Authentication برای Super Admin
  - ایجاد `app/api/admin/auth/login/route.ts` برای احراز هویت super admin
  - query کردن `saas_master.super_admins` و بررسی password
  - ایجاد JWT token با expiration 1 ساعت
  - ذخیره token در cookie
  - به‌روزرسانی `last_login` در دیتابیس
  - _Requirements: 4.1, 8.4_

- [x] 16. ایجاد API برای دریافت لیست Tenants
  - ایجاد `app/api/admin/tenants/route.ts` با method GET
  - query کردن تمام tenants از `saas_master.tenants`
  - پیاده‌سازی pagination (10 tenants per page)
  - پیاده‌سازی فیلتر بر اساس subscription_status
  - پیاده‌سازی جستجو بر اساس tenant_key یا company_name
  - _Requirements: 4.3_

- [x] 17. ایجاد API برای دریافت Dashboard Stats
  - ایجاد `app/api/admin/stats/route.ts`
  - محاسبه تعداد کل tenants، فعال، منقضی شده، معلق
  - محاسبه درآمد ماهانه و سالانه از `subscription_history`
  - برگرداندن آمار به‌صورت JSON
  - _Requirements: 4.2_

- [x] 18. پیاده‌سازی فرم افزودن Tenant جدید
  - ایجاد component `AddTenantModal.tsx` در admin panel
  - فیلدهای فرم: tenant_key, company_name, admin_name, admin_email, admin_phone, subscription_plan, subscription_months
  - اعتبارسنجی client-side (tenant_key فقط حروف کوچک و خط تیره)
  - پیاده‌سازی submit به API
  - _Requirements: 4.4_

- [x] 19. ایجاد API برای افزودن Tenant جدید
  - ایجاد `app/api/admin/tenants/route.ts` با method POST
  - اعتبارسنجی داده‌های ورودی
  - بررسی تکراری نبودن tenant_key
  - فراخوانی اسکریپت `createTenantDatabase`
  - ارسال ایمیل خوش‌آمدگویی با URL دسترسی و اطلاعات لاگین
  - برگرداندن پیام موفقیت یا خطا
  - _Requirements: 4.5, 3.1-3.8_

- [x] 20. پیاده‌سازی صفحه جزئیات Tenant
  - ایجاد `app/secret-zone-789/admin-panel/tenants/[id]/page.tsx`
  - نمایش اطلاعات کامل tenant
  - نمایش تاریخچه اشتراک‌ها
  - نمایش لاگ فعالیت‌ها
  - دکمه‌های عملیاتی: ویرایش، تمدید، تعلیق، فعال‌سازی، حذف
  - _Requirements: 4.6_

- [x] 21. پیاده‌سازی فرم تمدید اشتراک
  - ایجاد component `RenewSubscriptionModal.tsx`
  - فیلدهای فرم: انتخاب پلن، تعداد ماه، مبلغ (محاسبه خودکار)، یادداشت
  - پیاده‌سازی submit به API
  - _Requirements: 4.7_

- [x] 22. ایجاد API برای تمدید اشتراک
  - ایجاد `app/api/admin/tenants/[id]/renew/route.ts`
  - به‌روزرسانی `subscription_end` در جدول tenants
  - ایجاد رکورد جدید در `subscription_history`
  - ثبت لاگ در `tenant_activity_logs`
  - ارسال ایمیل تایید به admin tenant
  - _Requirements: 4.8_

- [x] 23. پیاده‌سازی عملیات تعلیق/فعال‌سازی Tenant
  - ایجاد `app/api/admin/tenants/[id]/suspend/route.ts`
  - ایجاد `app/api/admin/tenants/[id]/activate/route.ts`
  - تغییر `subscription_status` به "suspended" یا "active"
  - ثبت لاگ فعالیت
  - _Requirements: 4.9_

- [x] 24. پیاده‌سازی حذف Tenant (Soft Delete)
  - ایجاد `app/api/admin/tenants/[id]/delete/route.ts`
  - تغییر `is_deleted` به true (soft delete)
  - ثبت لاگ فعالیت
  - نوت: دیتابیس tenant حذف نمی‌شود
  - _Requirements: 4.10_

- [ ] 24.1 نوشتن integration tests برای Admin Panel

  - تست لاگین super admin
  - تست دریافت لیست tenants
  - تست ایجاد tenant جدید
  - تست تمدید اشتراک
  - تست تعلیق/فعال‌سازی tenant
  - _Requirements: 4.1-4.10_

## فاز 6: مدیریت Subscription Plans

- [x] 25. ایجاد API برای دریافت لیست Plans
  - ایجاد `app/api/admin/plans/route.ts` با method GET
  - query کردن تمام plans از `subscription_plans`
  - _Requirements: 5.1_

- [x] 26. پیاده‌سازی فرم افزودن/ویرایش Plan
  - ایجاد component `PlanFormModal.tsx` در admin panel
  - فیلدهای فرم: plan_key, plan_name, price_monthly, price_yearly, max_users, max_customers, max_storage_mb, features (checkboxes), description
  - _Requirements: 5.2_

- [x] 27. ایجاد API برای افزودن/ویرایش Plan
  - ایجاد `app/api/admin/plans/route.ts` با method POST
  - ایجاد `app/api/admin/plans/[id]/route.ts` با method PUT
  - اعتبارسنجی داده‌ها
  - ذخیره در `subscription_plans`
  - _Requirements: 5.3, 5.4_

- [x] 28. پیاده‌سازی غیرفعال کردن Plan
  - ایجاد `app/api/admin/plans/[id]/deactivate/route.ts`
  - تغییر `is_active` به false
  - نوت: tenants فعلی تحت تاثیر قرار نمی‌گیرند
  - _Requirements: 5.5_

## فاز 7: به‌روزرسانی Route Structure

- [x] 29. ایجاد Dynamic Route برای Tenants
  - ایجاد `app/[tenant_key]/layout.tsx` برای wrap کردن تمام صفحات tenant
  - استفاده از `useTenant` hook برای دریافت tenant context
  - نمایش پیام خطا اگر tenant نامعتبر باشد
  - _Requirements: 6.1, 6.2_

- [x] 30. انتقال صفحات موجود به ساختار جدید
  - ایجاد `app/[tenant_key]/dashboard` و `app/[tenant_key]/login` به عنوان نمونه
  - به‌روزرسانی تمام internal links برای استفاده از prefix `/{tenant_key}`
  - نوت: انتقال کامل صفحات موجود در فازهای بعدی انجام می‌شود
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 31. به‌روزرسانی Authentication برای Tenant-Specific Sessions
  - ایجاد `lib/tenant-auth.ts` برای ذخیره tenant_key در session
  - پیاده‌سازی `createTenantSession` و `verifyTenantSession`
  - بررسی tenant_key در session با tenant_key در URL
  - invalidate کردن session اگر tenant_key مطابقت نداشته باشد
  - _Requirements: 6.3, 8.3_

- [x] 32. به‌روزرسانی تمام API Routes برای Tenant Context
  - ایجاد `app/api/tenant/customers/route.ts` به عنوان نمونه
  - دریافت tenant_key از header یا session
  - استفاده از `getTenantConnection` برای اتصال به دیتابیس tenant
  - اطمینان از query کردن فقط داده‌های tenant فعلی
  - _Requirements: 2.3, 6.4_

- [ ]* 32.1 نوشتن integration tests برای tenant routes
  - تست دسترسی به dashboard از طریق `/{tenant_key}/dashboard`
  - تست لاگین tenant-specific
  - تست ایزولاسیون session بین tenants
  - _Requirements: 6.1, 6.2, 6.3_

## فاز 8: ایزولاسیون Rabin Voice

- [x] 33. به‌روزرسانی Rabin Voice API برای Tenant Context
  - ایجاد `صدای رابین/app/api/ai/tenant-route.ts` به عنوان نمونه
  - دریافت tenant_key از header یا query parameter
  - اتصال به دیتابیس tenant مربوطه
  - _Requirements: 7.1, 7.2_

- [x] 34. پیاده‌سازی بررسی Feature Access
  - بررسی اینکه tenant ویژگی `voice_assistant` را در پلن خود دارد
  - مسدود کردن دسترسی اگر ویژگی فعال نباشد
  - نمایش پیام مناسب
  - _Requirements: 7.4_

- [x] 35. اضافه کردن Tenant Context به Logging
  - اضافه کردن tenant_key به لاگ‌های Rabin Voice
  - نوت: پیاده‌سازی کامل logging در فازهای بعدی
  - _Requirements: 7.5_

- [ ]* 35.1 نوشتن integration test برای Rabin Voice isolation
  - تست استفاده از دستیار صوتی توسط tenant A
  - تست عدم دسترسی به داده‌های tenant B
  - تست مسدود شدن دسترسی برای tenant بدون ویژگی voice_assistant
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

## فاز 9: اسکریپت‌های خودکارسازی

- [ ] 36. ایجاد اسکریپت Backup
  - نوشتن `scripts/backup-all-tenants.sh`
  - backup از master database
  - backup از تمام tenant databases
  - compress کردن backups
  - حذف backups قدیمی‌تر از 30 روز
  - _Requirements: 9.2_

- [ ] 37. ایجاد اسکریپت Restore
  - نوشتن `scripts/restore-tenant.sh`
  - دریافت tenant_key و backup file به‌عنوان argument
  - restore کردن دیتابیس tenant از backup
  - _Requirements: 9.2_

- [ ] 38. ایجاد اسکریپت بررسی اشتراک‌های منقضی شده
  - نوشتن `scripts/check-expired-subscriptions.js`
  - query کردن tenants با `subscription_end < امروز`
  - تغییر `subscription_status` به "expired"
  - ارسال ایمیل اطلاع‌رسانی به admin tenant
  - ثبت لاگ فعالیت
  - راه‌اندازی به‌عنوان cron job روزانه
  - _Requirements: 9.3_

- [ ] 39. ایجاد اسکریپت Migration برای Tenant Databases
  - نوشتن `scripts/migrate-tenant-databases.js`
  - دریافت فایل migration SQL
  - اجرای migration روی تمام tenant databases
  - rollback در صورت خطا
  - ثبت گزارش نتیجه
  - _Requirements: 9.4_

## فاز 10: Nginx Configuration

- [ ] 40. به‌روزرسانی Nginx Config برای Route-based Access
  - به‌روزرسانی `nginx/default.conf`
  - اضافه کردن location block برای `/{tenant_key}/*`
  - proxy کردن به Next.js با header `X-Tenant-Key`
  - اطمینان از عدم تداخل با admin panel route
  - _Requirements: 6.5_

- [ ] 41. تست Nginx Configuration
  - restart کردن Nginx
  - تست دسترسی به `https://crm.robintejarat.com/rabin/dashboard`
  - تست دسترسی به admin panel
  - بررسی SSL certificate
  - _Requirements: 6.5_

## فاز 11: Performance Optimization

- [ ] 42. پیاده‌سازی Tenant Info Caching
  - نوشتن `lib/tenant-cache.ts` با استفاده از LRU Cache
  - cache کردن tenant info با TTL 5 دقیقه
  - پیاده‌سازی `invalidateTenantCache` برای invalidate کردن cache هنگام تغییر
  - _Requirements: 2.2_

- [ ] 43. پیاده‌سازی Connection Pool Management
  - محدود کردن تعداد connection pools فعال (مثلا 50 tenant)
  - پیاده‌سازی LRU eviction برای connection pools
  - _Requirements: 2.3_

- [ ] 44. اضافه کردن Database Indexes
  - اضافه کردن index روی `tenants.tenant_key`
  - اضافه کردن index روی `tenants.subscription_status`
  - اضافه کردن index روی `tenants.subscription_end`
  - _Requirements: 1.1_

## فاز 12: Monitoring و Logging

- [ ] 45. پیاده‌سازی Tenant Activity Logger
  - نوشتن `lib/tenant-logger.ts`
  - ثبت لاگ در فایل و دیتابیس
  - _Requirements: 9.1_

- [ ] 46. اضافه کردن Logging به عملیات مهم
  - لاگ کردن ایجاد tenant
  - لاگ کردن تمدید اشتراک
  - لاگ کردن تعلیق/فعال‌سازی
  - لاگ کردن لاگین super admin
  - _Requirements: 9.1_

## فاز 13: مستندسازی

- [ ] 47. نوشتن مستندات معماری
  - ایجاد `docs/SAAS_ARCHITECTURE.md`
  - توضیح معماری multi-tenant
  - دیاگرام‌های Mermaid
  - _Requirements: 10.1, 10.2_

- [ ] 48. نوشتن راهنمای Admin Panel
  - ایجاد `docs/ADMIN_PANEL_GUIDE.md`
  - راهنمای استفاده از پنل مدیریت
  - اسکرین‌شات‌ها
  - _Requirements: 10.1, 10.2_

- [ ] 49. نوشتن راهنمای راه‌اندازی Tenant
  - ایجاد `docs/TENANT_SETUP_GUIDE.md`
  - مراحل ایجاد tenant جدید
  - مثال‌های CLI
  - _Requirements: 10.1, 10.2_

- [ ] 50. نوشتن مستندات API
  - ایجاد `docs/API_DOCUMENTATION.md`
  - مستندات تمام API endpoints
  - مثال‌های request/response
  - _Requirements: 10.1, 10.2_

- [ ] 51. نوشتن راهنمای Deployment
  - ایجاد `docs/DEPLOYMENT_GUIDE.md`
  - مراحل deploy با Docker
  - تنظیمات environment variables
  - _Requirements: 10.1, 10.2_

- [ ] 52. نوشتن راهنمای Troubleshooting
  - ایجاد `docs/TROUBLESHOOTING.md`
  - مشکلات رایج و راه‌حل‌ها
  - _Requirements: 10.1, 10.2_

## فاز 14: Testing و Deployment

- [ ] 53. تست End-to-End با چند Tenant
  - ایجاد 3 tenant نمونه (rabin, irankhodro, test)
  - اضافه کردن داده نمونه به هر tenant
  - تست ایزولاسیون داده‌ها
  - تست دستیار صوتی در هر tenant
  - _Requirements: تمام requirements_

- [ ] 54. تست Performance
  - تست زمان پاسخ middleware
  - تست زمان اتصال به دیتابیس tenant
  - تست با 10+ tenant همزمان
  - _Requirements: 2.2, 2.3_

- [ ] 55. تست Security
  - تست عدم دسترسی tenant A به داده‌های tenant B
  - تست session isolation
  - تست SQL injection prevention
  - تست encryption/decryption passwords
  - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.6_

- [ ] 56. آماده‌سازی برای Production
  - به‌روزرسانی `docker-compose.yml` با تنظیمات production
  - تنظیم environment variables
  - راه‌اندازی SSL certificates
  - تنظیم cron jobs برای backup و check expired subscriptions
  - _Requirements: تمام requirements_

- [ ] 57. Deploy به Production
  - build کردن Docker images
  - deploy کردن با `docker-compose up -d`
  - تست تمام endpoints در production
  - monitoring logs
  - _Requirements: تمام requirements_

---

## خلاصه

این implementation plan شامل **57 تسک اصلی** است که به‌صورت incremental و قابل تست طراحی شده‌اند. تسک‌های اختیاری (مربوط به testing) با `*` علامت‌گذاری شده‌اند.

**تخمین زمان کلی**: 12-17 روز کاری (با 1-2 توسعه‌دهنده)

**اولویت اجرا**: 
1. فاز 1-3: راه‌اندازی پایه (Master DB, Middleware, Dynamic Connection)
2. فاز 4: اسکریپت ایجاد Tenant
3. فاز 5-6: Admin Panel
4. فاز 7-8: Route Structure و Rabin Voice
5. فاز 9-14: Automation, Optimization, Documentation, Testing
