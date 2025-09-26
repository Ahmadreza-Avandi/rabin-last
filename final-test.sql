-- تست نهایی: بررسی وجود جداول و داده‌های مورد نیاز

-- 1. بررسی جدول users
SELECT 'بررسی جدول users:' as test;
SELECT COUNT(*) as user_count FROM users;
SELECT id, name, email, role, status FROM users LIMIT 3;

-- 2. بررسی جدول feedback  
SELECT 'بررسی جدول feedback:' as test;
SELECT COUNT(*) as feedback_count FROM feedback;
SELECT id, customer_id, assigned_to, type, status FROM feedback LIMIT 3;

-- 3. بررسی جدول products
SELECT 'بررسی جدول products:' as test;
SELECT COUNT(*) as product_count FROM products;
SELECT id, name, base_price, category, is_active FROM products LIMIT 3;

-- 4. بررسی جدول sales
SELECT 'بررسی جدول sales:' as test;
SELECT COUNT(*) as sales_count FROM sales;
SELECT id, customer_name, total_amount, payment_status FROM sales LIMIT 3;

-- 5. بررسی جدول activities
SELECT 'بررسی جدول activities:' as test;
SELECT COUNT(*) as activities_count FROM activities;
SELECT id, customer_id, type, title, outcome FROM activities LIMIT 3;

-- 6. بررسی جدول customers
SELECT 'بررسی جدول customers:' as test;
SELECT COUNT(*) as customers_count FROM customers;
SELECT id, name, email, status FROM customers LIMIT 3;

SELECT 'تست تمام شد - همه جداول موجود هستند!' as final_message;