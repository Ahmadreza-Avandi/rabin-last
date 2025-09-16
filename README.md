# 🚀 سیستم CRM/CEM رابین تجارت

سیستم جامع مدیریت ارتباط با مشتری (CRM) و مدیریت تجربه مشتری (CEM) با قابلیت‌های پیشرفته

## ✨ ویژگی‌های کلیدی

### 🎯 مدیریت فروش
- ✅ ثبت و مدیریت فروش‌ها
- ✅ مدیریت معاملات و pipeline فروش
- ✅ گزارش‌گیری پیشرفته فروش
- ✅ نوتیفیکیشن‌های فروش برای مدیران

### 👥 مدیریت مشتریان
- ✅ ثبت و مدیریت اطلاعات مشتریان
- ✅ مدیریت مخاطبین
- ✅ سیستم بازخورد مشتریان
- ✅ باشگاه مشتریان

### 🏢 مدیریت همکاران
- ✅ مدیریت کاربران و نقش‌ها
- ✅ سیستم فعالیت‌ها
- ✅ تقویم مشترک
- ✅ چت داخلی

### 🤖 هوش مصنوعی و تحلیل صوتی
- ✅ تحلیل گزارشات با هوش مصنوعی
- ✅ تحلیل بازخوردها
- ✅ تحلیل فروش
- ✅ سیستم تحلیل صوتی پیشرفته
- ✅ دستورات صوتی فارسی و انگلیسی
- ✅ تبدیل متن به گفتار (TTS)

### 🎨 رابط کاربری
- ✅ طراحی ریسپانسیو
- ✅ پشتیبانی از تم تاریک/روشن
- ✅ فونت فارسی (وزیر)
- ✅ انیمیشن‌های روان

### 🔔 سیستم اطلاع‌رسانی
- ✅ نوتیفیکیشن‌های real-time
- ✅ اطلاع‌رسانی ایمیل
- ✅ نوتیفیکیشن‌های شخصی‌سازی شده

## 🛠️ تکنولوژی‌های استفاده شده

### Frontend
- **Next.js 14** - React Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Radix UI** - UI Components
- **Framer Motion** - Animations
- **Recharts** - Data Visualization

### Backend
- **Next.js API Routes** - Server-side Logic
- **MySQL** - Database
- **JWT** - Authentication
- **Nodemailer** - Email Service
- **bcryptjs** - Password Hashing

### DevOps
- **Docker** - Containerization
- **Nginx** - Reverse Proxy
- **Let's Encrypt** - SSL Certificates

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها
- Node.js 18+
- MySQL 8.0+
- npm یا yarn

### نصب محلی (Local Development)

1. **کلون کردن پروژه**
```bash
git clone https://github.com/your-repo/crm-system.git
cd crm-system
```

2. **نصب dependencies**
```bash
npm install
```

3. **تنظیم environment variables**
```bash
cp .env.local .env
# ویرایش فایل .env و تنظیم اطلاعات دیتابیس
```

4. **راه‌اندازی دیتابیس**
```bash
# ایجاد دیتابیس
mysql -u root -p -e "CREATE DATABASE crm_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# import کردن schema
mysql -u root -p crm_system < database/crm_system.sql

# اجرای migrations
./scripts/run-all-migrations.sh
```

5. **اجرای پروژه**
```bash
npm run dev
```

پروژه در آدرس `http://localhost:3000` در دسترس خواهد بود.

### نصب با Docker

1. **کلون کردن پروژه**
```bash
git clone https://github.com/your-repo/crm-system.git
cd crm-system
```

2. **تنظیم environment**
```bash
cp .env.master .env
# ویرایش فایل .env برای production
```

3. **اجرای با Docker Compose**
```bash
docker-compose up -d
```

## 📁 ساختار پروژه

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard Pages
│   ├── auth/             # Authentication Pages
│   └── globals.css       # Global Styles
├── components/            # React Components
│   ├── ui/               # UI Components
│   └── layout/           # Layout Components
├── lib/                  # Utility Libraries
├── database/             # Database Files
│   ├── migrations/       # Database Migrations
│   └── crm_system.sql   # Main Schema
├── scripts/              # Utility Scripts
├── nginx/                # Nginx Configuration
└── docker-compose.yml    # Docker Configuration
```

## 🔐 احراز هویت

سیستم از JWT برای احراز هویت استفاده می‌کند. نقش‌های مختلف:

- **CEO** - دسترسی کامل
- **Manager** - مدیریت تیم
- **Sales Manager** - مدیریت فروش
- **Sales Agent** - کارشناس فروش
- **Support** - پشتیبانی

## 🎤 سیستم تحلیل صوتی

سیستم تحلیل صوتی پیشرفته که امکان دریافت گزارشات و تحلیل‌ها از طریق دستورات صوتی را فراهم می‌کند.

### دستورات پشتیبانی شده

#### گزارشات همکاران
- **"گزارش خودم"** - گزارش همکار به نام "خودم"
- **"گزارش [نام همکار]"** - گزارش همکار مشخص
- **"report [employee name]"** - گزارش همکار (انگلیسی)

#### گزارشات تیم
- **"گزارشات امروز"** - تمام گزارشات امروز
- **"همه گزارشات"** - تمام گزارشات امروز
- **"کل گزارشات امروز"** - تمام گزارشات امروز
- **"تمام گزارشات امروز"** - تمام گزارشات امروز

#### تحلیل فروش
- **"تحلیل فروش یک هفته"** - تحلیل فروش هفتگی
- **"فروش ماه گذشته"** - تحلیل فروش ماهانه
- **"آمار فروش سه ماه"** - تحلیل فروش سه‌ماهه

#### تحلیل بازخوردها
- **"تحلیل بازخورد هفتگی"** - بازخوردهای هفته
- **"نظرات ماه گذشته"** - بازخوردهای ماه
- **"بازخورد سه ماه"** - بازخوردهای سه‌ماهه

#### تحلیل سودآوری
- **"تحلیل سودآوری هفتگی"** - سودآوری هفته
- **"سودآوری ماه گذشته"** - سودآوری ماه
- **"سود سه ماه"** - سودآوری سه‌ماهه

### ویژگی‌های سیستم
- 🎤 تشخیص گفتار فارسی و انگلیسی
- 🤖 تحلیل هوشمند با GPT
- 🔊 پاسخ صوتی با Sahab TTS
- 👥 کنترل دسترسی مدیریتی
- 📊 تحلیل جامع شامل:
  - خلاصه عملکرد
  - نقاط قوت و ضعف
  - چالش‌ها و مسائل
  - پیشنهادات بهبود
  - ارزیابی کلی (عالی/خوب/متوسط/ضعیف)

## 📊 API Documentation

### Authentication
- `POST /api/auth/login` - ورود کاربر
- `POST /api/auth/logout` - خروج کاربر
- `GET /api/auth/me` - اطلاعات کاربر جاری

### Sales
- `GET /api/sales` - دریافت فروش‌ها
- `POST /api/sales` - ثبت فروش جدید
- `PUT /api/sales` - ویرایش فروش

### Customers
- `GET /api/customers` - دریافت مشتریان
- `POST /api/customers` - ثبت مشتری جدید

### Notifications
- `GET /api/notifications` - دریافت اطلاع‌رسانی‌ها
- `POST /api/notifications/mark-read` - خواندن اطلاع‌رسانی

### Search
- `GET /api/search?q=query` - جستجو در سیستم

### Voice Analysis
- `POST /api/voice-analysis/process` - پردازش دستور صوتی
- `POST /api/voice-analysis/sahab-tts` - تبدیل متن به گفتار (API قدیمی)
- `POST /api/voice-analysis/sahab-tts-v2` - تبدیل متن به گفتار (API جدید)
- `GET /api/voice-analysis/sahab-tts-v2` - دریافت لیست صداهای موجود

## 🎵 سیستم صوتی

سیستم CRM از تکنولوژی‌های پیشرفته صوتی برای تعامل با کاربران استفاده می‌کند:

### ویژگی‌های صوتی
- **تشخیص گفتار فارسی**: پشتیبانی کامل از زبان فارسی
- **تبدیل متن به گفتار**: با کیفیت بالا و صداهای طبیعی
- **تحلیل دستورات صوتی**: درک هوشمند دستورات کاربر
- **سیستم Fallback**: اطمینان از عملکرد در همه شرایط

### سرویس‌های پشتیبانی شده
1. **Sahab TTS V2** (اولویت اول): API جدید با کیفیت عالی
2. **Sahab TTS V1** (پشتیبان): API قدیمی برای سازگاری
3. **TalkBot TTS** (نهایی): Fallback برای اطمینان از عملکرد

### پیکربندی
```bash
# در فایل .env
SAHAB_API_KEY="your-sahab-api-key-here"
```

برای اطلاعات بیشتر، فایل [SAHAB-TTS-V2-GUIDE.md](./SAHAB-TTS-V2-GUIDE.md) را مطالعه کنید.

### تست سیستم صوتی
برای تست کامل سیستم صوتی:

1. **تست خودکار**: `node test-voice-system.js`
2. **تست جزئی**: به آدرس `/test-voice` بروید
3. **تست کامل**: به آدرس `/test-complete-voice` بروید
4. **مراحل تست**:
   - شروع ضبط و صحبت به فارسی
   - بررسی تبدیل صدا به متن
   - تست تحلیل دستور و پردازش
   - تست تبدیل متن به گفتار
   - بررسی کیفیت صدای تولیدی

### نمونه دستورات:
- "گزارش خودم" - دریافت گزارش کاربر فعلی
- "تحلیل فروش" - تحلیل آمار فروش
- "تحلیل بازخورد" - تحلیل نظرات مشتریان

## 🎨 تم‌بندی

سیستم از دو تم پشتیبانی می‌کند:
- **تم روشن** (پیش‌فرض)
- **تم تاریک**

تغییر تم از طریق دکمه تم در header امکان‌پذیر است.

## 📱 ریسپانسیو

سیستم کاملاً ریسپانسیو است و در تمام اندازه‌های صفحه به خوبی کار می‌کند:
- **Desktop** (1024px+)
- **Tablet** (768px - 1023px)
- **Mobile** (< 768px)

## 🔧 تنظیمات محیط

### Local Development (.env.local)
```env
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=1234
DATABASE_NAME=crm_system
NODE_ENV=development
```

### Production (.env.master)
```env
DATABASE_HOST=mysql
DATABASE_USER=crm_app_user
DATABASE_PASSWORD=secure_password
DATABASE_NAME=crm_system
NODE_ENV=production
```

## 🚀 استقرار (Deployment)

### با Docker
```bash
# Build و اجرای containers
docker-compose up -d

# مشاهده logs
docker-compose logs -f

# متوقف کردن
docker-compose down
```

### Manual Deployment
```bash
# Build کردن پروژه
npm run build

# اجرای production
npm start
```

## 🔍 مانیتورینگ

سیستم شامل dashboard مانیتورینگ است که اطلاعات زیر را نمایش می‌دهد:
- آمار فروش
- تعداد مشتریان
- وضعیت سیستم
- آمار کاربران

## 🤝 مشارکت

برای مشارکت در پروژه:

1. Fork کنید
2. Branch جدید بسازید (`git checkout -b feature/amazing-feature`)
3. تغییرات را commit کنید (`git commit -m 'Add amazing feature'`)
4. Push کنید (`git push origin feature/amazing-feature`)
5. Pull Request بسازید

## 📝 لایسنس

این پروژه تحت لایسنس ISC منتشر شده است.

## 📞 پشتیبانی

برای پشتیبانی و سوالات:
- Email: support@rabin-tejarat.com
- GitHub Issues: [لینک به issues]

## 🔄 تغییرات اخیر

### نسخه 2.0.0
- ✅ اضافه شدن header با تغییر تم
- ✅ سیستم نوتیفیکیشن real-time
- ✅ بهبود UI/UX
- ✅ پشتیبانی کامل از موبایل
- ✅ سیستم جستجوی پیشرفته
- ✅ بهبود امنیت

---

**ساخته شده با ❤️ برای رابین تجارت خاورمیانه**