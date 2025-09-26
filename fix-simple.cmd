@echo off
chcp 65001 >nul
echo 🔧 حل ساده مشکلات دیتابیس...

REM Load database settings
set DB_HOST=localhost
set DB_PORT=3306
set DB_NAME=crm_system
set DB_USER=root
set DB_PASS=

REM Check if .env.local exists and load it
if exist .env.local (
    echo 📄 بارگذاری تنظیمات از .env.local...
    for /f "usebackq tokens=1,2 delims==" %%a in (".env.local") do (
        if "%%a"=="DB_HOST" set DB_HOST=%%b
        if "%%a"=="DB_PORT" set DB_PORT=%%b
        if "%%a"=="DB_NAME" set DB_NAME=%%b
        if "%%a"=="DB_USER" set DB_USER=%%b
        if "%%a"=="DB_PASS" set DB_PASS=%%b
    )
)

echo 📊 اتصال به دیتابیس: %DB_HOST%:%DB_PORT%/%DB_NAME%

REM Test MySQL connection
mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASS% -e "SELECT 1;" %DB_NAME% >nul 2>&1
if errorlevel 1 (
    echo ❌ خطا در اتصال به دیتابیس
    echo 💡 اطمینان حاصل کنید که MySQL در حال اجرا است
    pause
    exit /b 1
)

echo ✅ اتصال به دیتابیس موفق بود

REM Apply simple database fixes
echo 🔄 اعمال تعمیرات ساده دیتابیس...
mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASS% %DB_NAME% < fix-simple.sql
if errorlevel 1 (
    echo ❌ خطا در اعمال تعمیرات
    pause
    exit /b 1
)

echo ✅ تعمیرات ساده با موفقیت اعمال شدند

echo.
echo 🎉 تعمیرات ساده تمام شد!
echo.
echo 📋 تغییرات اعمال شده:
echo    ✅ ستون‌های مفقود به جدول feedback اضافه شدند
echo    ✅ جدول users ایجاد شد (اگر وجود نداشت)
echo    ✅ محصولات نمونه اضافه شدند
echo    ✅ ایندکس‌های ضروری اضافه شدند
echo    ✅ داده‌های ناسازگار اصلاح شدند
echo.
echo 🚀 حالا سرور را راه‌اندازی کنید:
echo    npm run dev
echo.
pause