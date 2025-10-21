# 🗄️ مستندات یکپارچگی دیتابیس - دستیار رابین

## 📋 خلاصه

این سند توضیح می‌دهد که چگونه لایه جدید **Database Integration** به سیستم دستیار رابین اضافه شده است. این لایه بین تشخیص گفتار و پردازش AI قرار می‌گیرد و کلمات کلیدی را شناسایی کرده و اطلاعات مرتبط را از دیتابیس دریافت می‌کند.

## 🔄 جریان کار جدید

```
کاربر صحبت می‌کنه
       ↓
Web Speech API (تشخیص گفتار)
       ↓
🆕 Keyword Detection & Database Query ← لایه جدید
       ↓
متن + داده‌های دیتابیس به Express API (/api/ai) ارسال می‌شه
       ↓
OpenRouter (Claude) پاسخ تولید می‌کنه
       ↓
پاسخ به TTS API ارسال می‌شه
       ↓
فایل صوتی تولید و پخش می‌شه
       ↓
چرخه دوباره شروع می‌شه (Auto-listening)
```

## 🏗️ معماری لایه جدید

### 📁 فایل‌های اضافه شده:

```
api/
├── services/
│   ├── database.js          # اتصال و کوئری‌های دیتابیس
│   ├── keywordDetector.js   # تشخیص کلمات کلیدی
│   └── README.md           # مستندات سرویس‌ها
├── middleware/
│   └── dataEnrichment.js   # Middleware غنی‌سازی داده
├── routes/
│   └── database.js         # API routes تست
└── test/
    └── testDatabase.js     # تست‌های خودکار
```

## 🔧 تنظیمات دیتابیس

```javascript
const DB_CONFIG = {
  host: "181.41.194.136",
  database: "crm_system", 
  user: "crm_app_user",
  password: "Ahmad.1386"
};
```

## 🔑 کلمات کلیدی پشتیبانی شده

### 👥 همکاران
- **کلمات**: همکاران، همکار، کارمندان، کارمند، پرسنل، تیم
- **عملکرد**: دریافت لیست همکاران فعال
- **جدول**: `employees`

### 👤 مشتریان
- **کلمات**: مشتریان، مشتری، کلاینت، خریدار
- **عملکرد**: دریافت لیست مشتریان فعال
- **جدول**: `customers`

### 💰 فروش
- **کلمات**: فروش، فروشات، درآمد، سفارش، سفارشات
- **کلمات زمانی**: امروز، هفته، ماه، هفتگی، ماهانه
- **عملکرد**: گزارش فروش بر اساس دوره زمانی
- **جدول**: `sales`

### 📋 وظایف
- **کلمات**: وظایف، وظیفه، تسک، تسک‌ها، کار، کارها
- **نام‌های همکاران**: احمد، علی، سارا، محمد، فاطمه، حسن، مریم
- **عملکرد**: دریافت وظایف فعال (با یا بدون فیلتر همکار)
- **جدول**: `tasks`

### 🚀 پروژه‌ها
- **کلمات**: پروژه، پروژه‌ها، پروژه های، پرژه
- **عملکرد**: دریافت پروژه‌های فعال
- **جدول**: `projects`

## 📊 ساختار جداول (فرضی)

```sql
-- جدول همکاران
CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  position VARCHAR(100),
  department VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  status ENUM('active', 'inactive')
);

-- جدول مشتریان
CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  company VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  status ENUM('active', 'inactive'),
  created_at TIMESTAMP
);

-- جدول فروش
CREATE TABLE sales (
  id INT PRIMARY KEY,
  amount DECIMAL(10,2),
  customer_id INT,
  created_at TIMESTAMP
);

-- جدول وظایف
CREATE TABLE tasks (
  id INT PRIMARY KEY,
  title VARCHAR(200),
  description TEXT,
  status ENUM('pending', 'in_progress', 'completed'),
  priority ENUM('low', 'medium', 'high'),
  assignee VARCHAR(100),
  due_date DATE,
  created_at TIMESTAMP
);

-- جدول پروژه‌ها
CREATE TABLE projects (
  id INT PRIMARY KEY,
  name VARCHAR(200),
  description TEXT,
  status ENUM('planning', 'active', 'completed'),
  start_date DATE,
  end_date DATE,
  manager VARCHAR(100),
  budget DECIMAL(12,2)
);
```

## 🔄 نحوه کار سیستم

### 1️⃣ تشخیص کلمات کلیدی
```javascript
// مثال: "لیست همکاران فعال رو نشون بده"
const keywords = detectKeywords(userText);
// نتیجه: [{ keyword: 'همکاران', action: 'getEmployees' }]
```

### 2️⃣ اجرای کوئری دیتابیس
```javascript
const result = await executeAction('getEmployees');
// نتیجه: { success: true, data: [...], count: 15 }
```

### 3️⃣ غنی‌سازی پیام
```javascript
// پیام اصلی: "لیست همکاران رو بده"
// پیام غنی‌شده:
"لیست همکاران رو بده

[اطلاعات سیستم: 
📋 دریافت اطلاعات همکاران:
- تعداد همکاران فعال: 15
- نمونه: احمد رضایی، علی محمدی، سارا احمدی
]"
```

## 🛠️ نصب و راه‌اندازی

### 1. نصب Dependencies
```bash
npm install mysql2
```

### 2. تست اتصال دیتابیس
```bash
node api/test/testDatabase.js
```

### 3. تست از طریق مرورگر
```
http://localhost:3000/test-database-integration.html
```

## 🔍 API های تست

### تست اتصال
```
GET /api/database/test-connection
```

### تست کلمات کلیدی
```
POST /api/database/test-keywords
Body: { "text": "لیست همکاران رو بده" }
```

### دریافت مستقیم داده‌ها
```
GET /api/database/employees
GET /api/database/customers  
GET /api/database/sales/today
GET /api/database/tasks
GET /api/database/projects
```

## 🎯 مثال‌های کاربردی

### مثال 1: درخواست همکاران
**ورودی کاربر**: "لیست همکاران فعال رو نشون بده"

**پردازش**:
1. تشخیص کلمه "همکاران" 
2. اجرای `getEmployees()`
3. غنی‌سازی پیام با اطلاعات 15 همکار
4. ارسال به AI با context کامل

**پاسخ AI**: "در حال حاضر 15 همکار فعال داریم شامل احمد رضایی، علی محمدی و سارا احمدی. همه آن‌ها در بخش‌های مختلف مشغول به کار هستند."

### مثال 2: گزارش فروش
**ورودی کاربر**: "فروش هفته گذشته چطور بوده؟"

**پردازش**:
1. تشخیص کلمه "فروش" + "هفته"
2. اجرای `getSalesReport('week')`
3. غنی‌سازی با آمار فروش هفتگی

**پاسخ AI**: "فروش هفته گذشته عالی بوده! مجموعاً 25 فروش داشتیم به ارزش 150 میلیون تومان."

## 🛡️ مدیریت خطا و امنیت

### مدیریت خطا
- اگر دیتابیس در دسترس نباشد، سیستم بدون داده ادامه می‌دهد
- خطاهای SQL لاگ می‌شوند ولی سیستم را خراب نمی‌کنند
- Timeout برای جلوگیری از hang شدن (10 ثانیه)

### امنیت
- استفاده از Prepared Statements برای جلوگیری از SQL Injection
- Connection Pooling برای مدیریت بهتر منابع
- محدودیت تعداد رکوردهای بازگشتی

## 🚀 بهبودهای آینده

### فاز 1 (فعلی)
- ✅ تشخیص کلمات کلیدی اساسی
- ✅ اتصال به دیتابیس MySQL
- ✅ غنی‌سازی پیام برای AI
- ✅ مدیریت خطا

### فاز 2 (آینده نزدیک)
- [ ] Cache کردن نتایج دیتابیس
- [ ] پشتیبانی از کلمات کلیدی پیچیده‌تر
- [ ] تشخیص نام‌های شخصی با NLP
- [ ] گزارش‌های تحلیلی پیشرفته

### فاز 3 (آینده دور)
- [ ] Real-time data updates
- [ ] Machine Learning برای بهبود تشخیص
- [ ] پشتیبانی از چند دیتابیس
- [ ] Dashboard مدیریتی

## 🧪 تست و عیب‌یابی

### لاگ‌های مهم
```javascript
console.log('🔍 Analyzing text for keywords:', text);
console.log('✅ Found keyword:', keyword);
console.log('⚡ Executing action:', action);
console.log('📊 Total keywords found:', count);
```

### مشکلات رایج
1. **اتصال دیتابیس**: بررسی IP، username، password
2. **کلمات کلیدی**: بررسی املای کلمات فارسی
3. **Performance**: بررسی تعداد رکوردهای بازگشتی

### ابزارهای تست
- `test-database-integration.html` - تست کامل از مرورگر
- `api/test/testDatabase.js` - تست خودکار
- Postman Collection - تست API ها

## 📞 پشتیبانی

برای مشکلات فنی یا سوالات:
- بررسی لاگ‌های console
- اجرای تست‌های خودکار
- بررسی اتصال دیتابیس
- مطالعه این مستندات

---

**نکته**: این لایه به گونه‌ای طراحی شده که در صورت عدم دسترسی به دیتابیس، سیستم اصلی همچنان کار کند و تجربه کاربری خراب نشود.