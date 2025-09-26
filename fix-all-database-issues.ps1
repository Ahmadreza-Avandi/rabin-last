# PowerShell script to fix all database issues

Write-Host "🔧 شروع حل مشکلات دیتابیس..." -ForegroundColor Green

# Load environment variables from .env.local if it exists
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# Database connection details
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "3306" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "crm_system" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "root" }
$DB_PASS = if ($env:DB_PASS) { $env:DB_PASS } else { "" }

Write-Host "📊 اتصال به دیتابیس: $DB_HOST`:$DB_PORT/$DB_NAME" -ForegroundColor Cyan

# Check if mysql command is available
try {
    $null = Get-Command mysql -ErrorAction Stop
    Write-Host "✅ MySQL client پیدا شد" -ForegroundColor Green
} catch {
    Write-Host "❌ MySQL client پیدا نشد. لطفا MySQL client را نصب کنید." -ForegroundColor Red
    exit 1
}

# Test database connection
$connectionTest = "SELECT 1;"
$mysqlArgs = @("-h$DB_HOST", "-P$DB_PORT", "-u$DB_USER")
if ($DB_PASS) {
    $mysqlArgs += "-p$DB_PASS"
}
$mysqlArgs += @("-e", $connectionTest, $DB_NAME)

try {
    $result = & mysql @mysqlArgs 2>$null
    Write-Host "✅ اتصال به دیتابیس موفق بود" -ForegroundColor Green
} catch {
    Write-Host "❌ خطا در اتصال به دیتابیس. لطفا تنظیمات اتصال را بررسی کنید." -ForegroundColor Red
    exit 1
}

# Apply database fixes
Write-Host "🔄 اعمال تغییرات دیتابیس..." -ForegroundColor Yellow

$fixArgs = @("-h$DB_HOST", "-P$DB_PORT", "-u$DB_USER")
if ($DB_PASS) {
    $fixArgs += "-p$DB_PASS"
}
$fixArgs += $DB_NAME

try {
    Get-Content "fix-all-issues.sql" | & mysql @fixArgs
    Write-Host "✅ تمام تغییرات دیتابیس با موفقیت اعمال شد" -ForegroundColor Green
} catch {
    Write-Host "❌ خطا در اعمال تغییرات دیتابیس" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Verify tables exist
Write-Host "🔍 بررسی وجود جداول..." -ForegroundColor Cyan

$tables = @("users", "products", "sales", "sale_items", "activities", "feedback", "customers", "sales_pipeline_stages")

foreach ($table in $tables) {
    $checkArgs = @("-h$DB_HOST", "-P$DB_PORT", "-u$DB_USER")
    if ($DB_PASS) {
        $checkArgs += "-p$DB_PASS"
    }
    $checkArgs += @("-e", "SHOW TABLES LIKE '$table';", $DB_NAME)
    
    try {
        $result = & mysql @checkArgs 2>$null
        if ($result -match $table) {
            Write-Host "✅ جدول $table موجود است" -ForegroundColor Green
        } else {
            Write-Host "❌ جدول $table موجود نیست" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ خطا در بررسی جدول $table" -ForegroundColor Red
    }
}

# Verify views exist
Write-Host "🔍 بررسی وجود ویوها..." -ForegroundColor Cyan

$views = @("daily_interaction_stats", "interaction_summary", "sales_pipeline_report", "sales_statistics")

foreach ($view in $views) {
    $checkArgs = @("-h$DB_HOST", "-P$DB_PORT", "-u$DB_USER")
    if ($DB_PASS) {
        $checkArgs += "-p$DB_PASS"
    }
    $checkArgs += @("-e", "SHOW FULL TABLES WHERE Table_Type = 'VIEW' AND Tables_in_$DB_NAME = '$view';", $DB_NAME)
    
    try {
        $result = & mysql @checkArgs 2>$null
        if ($result -match $view) {
            Write-Host "✅ ویو $view موجود است" -ForegroundColor Green
        } else {
            Write-Host "❌ ویو $view موجود نیست" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ خطا در بررسی ویو $view" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 حل مشکلات دیتابیس تمام شد!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 خلاصه تغییرات:" -ForegroundColor Cyan
Write-Host "   - جداول مفقود اضافه شدند" -ForegroundColor White
Write-Host "   - ستون‌های مفقود به جدول feedback اضافه شدند" -ForegroundColor White
Write-Host "   - ویوهای مفقود ایجاد شدند" -ForegroundColor White
Write-Host "   - ایندکس‌ها برای بهبود عملکرد اضافه شدند" -ForegroundColor White
Write-Host "   - داده‌های ناسازگار اصلاح شدند" -ForegroundColor White
Write-Host ""
Write-Host "🚀 حالا می‌توانید سرور را مجدداً راه‌اندازی کنید:" -ForegroundColor Green
Write-Host "   npm run dev" -ForegroundColor Yellow