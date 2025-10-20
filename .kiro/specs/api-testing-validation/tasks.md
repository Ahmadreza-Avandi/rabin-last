# Implementation Plan

- [ ] 1. راه‌اندازی ساختار پروژه و پیکربندی اولیه
  - ایجاد ساختار فولدرها در `scripts/api-testing/`
  - ایجاد فایل پیکربندی `config.ts` با تنظیمات پایه
  - ایجاد فایل `.env.test` برای اطلاعات احراز هویت تستی
  - تعریف TypeScript interfaces و types در `types.ts`
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 2. پیاده‌سازی API Discovery System
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 2.1 ایجاد API Scanner
  - پیاده‌سازی `api-scanner.ts` برای اسکن فولدرهای API
  - متد `scanAPIs()` برای شناسایی تمام route files
  - متد `categorizeEndpoint()` برای دسته‌بندی APIها (api, secret-zone, tenant)
  - _Requirements: 1.1, 1.2_

- [ ] 2.2 ایجاد Route Parser
  - پیاده‌سازی `route-parser.ts` برای تحلیل فایل‌های route
  - استخراج متدهای HTTP (GET, POST, PUT, DELETE)
  - تشخیص نیاز به احراز هویت از کد
  - تشخیص نیاز به tenant_key
  - _Requirements: 1.1, 1.2, 3.1_

- [ ] 3. پیاده‌سازی Authentication Manager
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 3.1 ایجاد Auth Manager اصلی
  - پیاده‌سازی `auth-manager.ts` با متدهای login
  - متد `login()` برای لاگین با اطلاعات کاربری
  - متد `getAdminToken()` برای دریافت توکن مدیر
  - متد `getTenantToken()` برای دریافت توکن tenant
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3.2 پیاده‌سازی Token Cache
  - ایجاد `token-cache.ts` برای cache کردن توکن‌ها
  - بررسی اعتبار توکن‌ها (expiration check)
  - مدیریت refresh token در صورت نیاز
  - _Requirements: 2.4, 2.6_

- [ ] 4. پیاده‌سازی Test Data Provider
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 4.1 ایجاد Test Data Manager
  - پیاده‌سازی `test-data.ts` با متدهای تولید داده تستی
  - متد `getCustomerData()` برای داده مشتری
  - متد `getDealData()` برای داده معامله
  - متد `getTaskData()` برای داده وظیفه
  - متد `getProductData()` برای داده محصول
  - _Requirements: 1.1, 6.1, 7.1, 14.1_

- [ ] 4.2 پیاده‌سازی Data Cleanup
  - متد `cleanup()` برای پاک کردن داده‌های تستی
  - ردیابی IDهای ایجاد شده در `createdIds`
  - حذف خودکار داده‌ها پس از تست
  - _Requirements: 1.4, 5.1_

- [ ] 5. پیاده‌سازی Test Generator
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 5.1 ایجاد Test Suite Generator
  - پیاده‌سازی `test-generator.ts` با متد `generateTests()`
  - تولید تست‌های CRUD برای هر endpoint
  - تولید تست‌های احراز هویت
  - تولید تست‌های validation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 5.2 پیاده‌سازی CRUD Test Generator
  - متد `generateCRUDTests()` برای تولید تست‌های CRUD
  - تست CREATE با داده معتبر و نامعتبر
  - تست READ با pagination و فیلتر
  - تست UPDATE با داده معتبر و نامعتبر
  - تست DELETE با ID معتبر و نامعتبر
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 5.3 پیاده‌سازی Auth Test Generator
  - متد `generateAuthTests()` برای تست احراز هویت
  - تست بدون توکن (انتظار 401)
  - تست با توکن نامعتبر (انتظار 401)
  - تست با توکن معتبر (انتظار 200)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 5.4 پیاده‌سازی Tenant Isolation Test Generator
  - تولید تست‌های جداسازی tenant
  - تست دسترسی به داده‌های tenant دیگر (انتظار 403)
  - تست با tenant_key معتبر
  - تست با tenant_key نامعتبر (انتظار 404)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [ ] 6. پیاده‌سازی Test Runner
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 6.1 ایجاد HTTP Client
  - پیاده‌سازی `http-client.ts` با axios یا fetch
  - مدیریت timeout و retry
  - اندازه‌گیری زمان پاسخ
  - مدیریت خطاهای شبکه
  - _Requirements: 15.1, 15.2, 15.7, 15.8_

- [ ] 6.2 پیاده‌سازی Test Runner اصلی
  - ایجاد `test-runner.ts` با متد `runTest()`
  - متد `runBatch()` برای اجرای دسته‌ای تست‌ها
  - متد `runConcurrent()` برای اجرای همزمان با محدودیت concurrency
  - مدیریت خطاها و retry logic
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 6.3 پیاده‌سازی Progress Tracking
  - نمایش پیشرفت تست‌ها در console
  - نمایش تعداد تست‌های موفق/ناموفق
  - نمایش زمان سپری شده
  - _Requirements: 5.1, 5.2_

- [ ] 7. پیاده‌سازی Validation Layer
  - _Requirements: 1.5, 1.6, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

- [ ] 7.1 ایجاد Response Validator
  - پیاده‌سازی `response-validator.ts`
  - بررسی کد وضعیت HTTP
  - بررسی ساختار JSON پاسخ
  - بررسی فیلدهای الزامی
  - _Requirements: 1.5, 1.6, 4.6_

- [ ] 7.2 پیاده‌سازی Security Validator
  - ایجاد `security-validator.ts`
  - تست SQL Injection
  - تست XSS
  - تست Path Traversal
  - بررسی عدم افشای اطلاعات حساس
  - _Requirements: 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ] 7.3 پیاده‌سازی Performance Validator
  - ایجاد `performance-validator.ts`
  - بررسی زمان پاسخ (threshold: 2 ثانیه)
  - شناسایی APIهای کند
  - تست تحت بار
  - _Requirements: 15.1, 15.2, 15.8_

- [ ] 8. پیاده‌سازی تست‌های ماژول‌های خاص
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 8.1 تست APIهای داشبورد
  - تست `/api/dashboard/stats` برای آمار
  - تست `/api/dashboard/admin` برای داشبورد مدیر
  - بررسی صحت داده‌های آماری
  - تست فیلترهای تاریخ
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 8.2 تست APIهای معاملات
  - تست `/api/deals` برای CRUD معاملات
  - تست تغییر مرحله معامله
  - تست فیلتر وضعیت
  - تست محاسبه ارزش معاملات
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 8.3 تست APIهای وظایف
  - تست `/api/tasks` برای CRUD وظایف
  - تست تکمیل وظیفه
  - تست فیلتر سررسید
  - تست اختصاص وظیفه به کاربر
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 8.4 تست APIهای ماژول‌های اضافی
  - تست `/api/email/send` برای ارسال ایمیل
  - تست `/api/uploads` برای آپلود فایل
  - تست `/api/chat` برای مکالمات
  - تست `/api/sms/send` برای ارسال SMS
  - تست `/api/documents` برای مدیریت اسناد
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 9. پیاده‌سازی تست APIهای گزارش‌گیری و جستجو
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 9.1 تست APIهای گزارش‌گیری
  - تست `/api/reports` برای گزارش فروش
  - تست `/api/reports/analyze` برای تحلیل
  - تست `/api/reports/today` برای گزارش امروز
  - تست فیلترهای زمانی
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 9.2 تست APIهای جستجو
  - تست `/api/search` برای جستجوی عمومی
  - تست `/api/customers/filter-options` برای گزینه‌های فیلتر
  - تست فیلترهای پیشرفته
  - تست جستجو در اسناد
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 10. پیاده‌سازی تست APIهای نوتیفیکیشن و کاربران
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ] 10.1 تست APIهای نوتیفیکیشن
  - تست `/api/notifications` برای لیست نوتیفیکیشن‌ها
  - تست `/api/notifications/mark-read` برای علامت‌گذاری خوانده شده
  - تست `/api/events` برای رویدادهای تقویم
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 10.2 تست APIهای مدیریت کاربران
  - تست `/api/users` برای CRUD کاربران
  - تست `/api/permissions` برای مدیریت دسترسی‌ها
  - تست `/api/permissions/check` برای بررسی دسترسی
  - تست `/api/coworkers` برای لیست همکاران
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ] 11. پیاده‌سازی تست APIهای محصولات و پنل مدیریت
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 11.1 تست APIهای محصولات
  - تست `/api/products` برای CRUD محصولات
  - تست `/api/customer-product-interests` برای علاقه‌مندی‌ها
  - تست `/api/customer-club/send-message` برای باشگاه مشتریان
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ] 11.2 تست APIهای پنل مدیریت (Secret Zone)
  - تست لاگین به `/secret-zone-789/login`
  - تست `/api/admin/tenants` برای مدیریت tenantها
  - تست `/api/admin/stats` برای آمار سیستم
  - تست `/api/admin/plans` برای مدیریت پلن‌ها
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 12. پیاده‌سازی Report Generator
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 12.1 ایجاد Report Generator اصلی
  - پیاده‌سازی `report-generator.ts` با متد `generateReport()`
  - محاسبه آمار کلی (total, passed, failed, duration)
  - دسته‌بندی نتایج بر اساس category
  - شناسایی تست‌های ناموفق و APIهای کند
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 12.2 پیاده‌سازی HTML Reporter
  - ایجاد `html-reporter.ts` برای تولید گزارش HTML
  - طراحی template فارسی با RTL
  - نمایش خلاصه با نمودار
  - جدول تست‌های ناموفق با جزئیات
  - لیست APIهای کند
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 12.3 پیاده‌سازی JSON Reporter
  - ایجاد `json-reporter.ts` برای تولید گزارش JSON
  - ساختار JSON با تمام جزئیات
  - قابلیت parse برای ابزارهای دیگر
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 12.4 پیاده‌سازی Markdown Reporter
  - ایجاد `markdown-reporter.ts` برای تولید گزارش Markdown
  - فرمت مناسب برای README
  - جداول و لیست‌های فرمت شده
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 13. پیاده‌سازی Error Handling و Logging
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 15.7_

- [ ] 13.1 ایجاد Error Handler
  - پیاده‌سازی کلاس `TestError` برای خطاهای تست
  - کلاس `ErrorHandler` برای مدیریت انواع خطاها
  - متدهای مدیریت Network، Timeout، Auth errors
  - _Requirements: 5.2, 5.3, 5.4, 15.7_

- [ ] 13.2 پیاده‌سازی Logger
  - ایجاد `logger.ts` برای لاگ کردن
  - سطوح مختلف log (info, warn, error, debug)
  - ذخیره لاگ‌ها در فایل
  - نمایش رنگی در console
  - _Requirements: 5.1, 5.2, 5.6_

- [ ] 14. ایجاد Entry Point و CLI Interface
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 14.1 پیاده‌سازی Main Entry Point
  - ایجاد `index.ts` به عنوان entry point
  - ترکیب تمام کامپوننت‌ها
  - فلوی اجرای کامل (Discovery → Auth → Test → Report)
  - مدیریت cleanup در پایان
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 14.2 ایجاد CLI Interface
  - پیاده‌سازی command line arguments
  - گزینه‌های مختلف (--category, --endpoint, --format)
  - نمایش help و usage
  - _Requirements: 5.1, 5.2_

- [ ] 14.3 ایجاد npm script
  - افزودن script به `package.json`
  - دستور `npm run test:api` برای اجرای تست‌ها
  - دستور `npm run test:api:report` برای مشاهده گزارش
  - _Requirements: 5.1, 5.2_

- [ ] 15. تست و بهینه‌سازی نهایی
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

- [ ] 15.1 اجرای تست کامل سیستم
  - اجرای تست روی تمام APIها
  - بررسی نتایج و شناسایی مشکلات
  - رفع باگ‌های احتمالی
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 15.2 بهینه‌سازی عملکرد
  - بهبود سرعت اجرای تست‌ها
  - بهینه‌سازی concurrent execution
  - کاهش مصرف حافظه
  - _Requirements: 15.1, 15.2, 15.8_

- [ ] 15.3 تولید مستندات
  - ایجاد README.md برای راهنمای استفاده
  - مستندات API testing system
  - نمونه‌های استفاده
  - _Requirements: 5.1, 5.2_

- [ ] 15.4 ایجاد گزارش نهایی
  - اجرای تست نهایی روی تمام APIها
  - تولید گزارش جامع با تمام فرمت‌ها
  - لیست APIهای معیوب و مشکلات
  - پیشنهادات برای رفع مشکلات
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
