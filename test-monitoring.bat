@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 🔍 اسکریپت تست System Monitoring Dashboard برای Windows
REM استفاده: test-monitoring.bat [options]

echo 🔍 تست System Monitoring Dashboard
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REM بررسی وجود Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js یافت نشد. لطفاً Node.js را نصب کنید.
    pause
    exit /b 1
)

REM بررسی وجود فایل تست
if not exist "test-system-monitoring.js" (
    echo ❌ فایل test-system-monitoring.js یافت نشد.
    pause
    exit /b 1
)

REM اگر آرگومان داده شده، از آن استفاده کن
if "%1"=="" goto interactive

if /i "%1"=="local" goto local
if /i "%1"=="--local" goto local
if /i "%1"=="-l" goto local

if /i "%1"=="server" goto server
if /i "%1"=="--server" goto server
if /i "%1"=="-s" goto server

if /i "%1"=="verbose" goto verbose
if /i "%1"=="--verbose" goto verbose
if /i "%1"=="-v" goto verbose

if /i "%1"=="server-verbose" goto server-verbose
if /i "%1"=="--server-verbose" goto server-verbose
if /i "%1"=="-sv" goto server-verbose

if /i "%1"=="quick" goto quick
if /i "%1"=="--quick" goto quick
if /i "%1"=="-q" goto quick

if /i "%1"=="full" goto full
if /i "%1"=="--full" goto full
if /i "%1"=="-f" goto full

if /i "%1"=="help" goto help
if /i "%1"=="--help" goto help
if /i "%1"=="-h" goto help

echo ❌ گزینه نامعتبر: %1
echo 💡 برای مشاهده راهنما: test-monitoring.bat help
pause
exit /b 1

:interactive
echo 📋 گزینه‌های موجود:
echo    1. تست لوکال (localhost:3000)
echo    2. تست سرور (crm.robintejarat.com)
echo    3. تست لوکال با جزئیات
echo    4. تست سرور با جزئیات
echo    5. تست سریع (بدون لاگین)
echo    6. تست کامل سرور
echo    7. تست دستی
echo.

set /p choice="انتخاب کنید (1-7): "

if "%choice%"=="1" goto local
if "%choice%"=="2" goto server
if "%choice%"=="3" goto verbose
if "%choice%"=="4" goto server-verbose
if "%choice%"=="5" goto quick
if "%choice%"=="6" goto full
if "%choice%"=="7" goto manual

echo ❌ انتخاب نامعتبر
pause
exit /b 1

:local
echo 🏠 تست لوکال...
node test-system-monitoring.js --local
goto end

:server
echo 🌐 تست سرور...
node test-system-monitoring.js --server
goto end

:verbose
echo 🏠🔍 تست لوکال با جزئیات...
node test-system-monitoring.js --local --verbose
goto end

:server-verbose
echo 🌐🔍 تست سرور با جزئیات...
node test-system-monitoring.js --server --verbose
goto end

:quick
echo ⚡ تست سریع...
node test-system-monitoring.js --local --skip-login
goto end

:full
echo 🎯 تست کامل سرور...
node test-system-monitoring.js --server --verbose
goto end

:manual
echo 🔧 تست دستی - وارد کردن دستور:
echo node test-system-monitoring.js [--local^|--server] [--verbose] [--skip-login]
set /p manual_command="دستور خود را وارد کنید: "
%manual_command%
goto end

:help
echo 📖 راهنما:
echo    test-monitoring.bat local          - تست لوکال
echo    test-monitoring.bat server         - تست سرور
echo    test-monitoring.bat verbose        - تست لوکال با جزئیات
echo    test-monitoring.bat server-verbose - تست سرور با جزئیات
echo    test-monitoring.bat quick          - تست سریع بدون لاگین
echo    test-monitoring.bat full           - تست کامل سرور
echo    test-monitoring.bat help           - نمایش راهنما
goto end

:end
echo.
echo ✅ تست تمام شد!
echo.
echo 📋 دستورات مفید:
echo    • تست مجدد لوکال: test-monitoring.bat local
echo    • تست مجدد سرور: test-monitoring.bat server
echo    • مشاهده لاگ‌های سرور: docker-compose logs -f nextjs
echo    • راه‌اندازی مجدد: docker-compose restart nextjs
echo    • بررسی وضعیت: docker-compose ps
echo.
pause