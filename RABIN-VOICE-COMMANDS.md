# 🎤 دستورات مدیریت صدای رابین

## 🚀 راه‌اندازی و ری‌استارت

### ری‌استارت کامل (با rebuild)
```bash
chmod +x restart-rabin-voice.sh
./restart-rabin-voice.sh
```

این اسکریپت:
- ✅ Cache ها را پاک می‌کند
- ✅ کانتینر را rebuild می‌کند
- ✅ سرویس را مجدداً راه‌اندازی می‌کند
- ✅ Nginx را ری‌استارت می‌کند (ضروری برای دامنه)
- ✅ وضعیت سلامت را بررسی می‌کند
- ✅ اتصال به دامنه را تست می‌کند

**زمان اجرا:** 3-5 دقیقه

### ری‌استارت سریع (بدون rebuild)
```bash
chmod +x quick-restart-rabin-voice.sh
./quick-restart-rabin-voice.sh
```

این اسکریپت:
- ⚡ کانتینر rabin-voice را ری‌استارت می‌کند
- ⚡ Nginx را ری‌استارت می‌کند (ضروری)
- ⚡ اتصال شبکه را تست می‌کند
- ⚡ سریع‌تر از rebuild کامل است
- ⚡ برای تغییرات .env مناسب است

**زمان اجرا:** 15-20 ثانیه

### بررسی وضعیت
```bash
chmod +x status-rabin-voice.sh
./status-rabin-voice.sh
```

این اسکریپت:
- 📊 وضعیت کانتینرها را نمایش می‌دهد
- 🏥 سلامت سرویس‌ها را بررسی می‌کند
- 🔌 پورت‌ها را چک می‌کند
- 🔗 اتصال شبکه داخلی را تست می‌کند
- 🌐 دسترسی از دامنه را بررسی می‌کند
- 💾 استفاده از منابع را نمایش می‌دهد

---

## 📋 مشاهده لاگ‌ها

### مشاهده لاگ‌های زنده
```bash
chmod +x logs-rabin-voice.sh
./logs-rabin-voice.sh
```

### مشاهده لاگ‌های اخیر (50 خط)
```bash
docker-compose logs --tail=50 rabin-voice
```

### مشاهده لاگ‌های زنده با docker-compose
```bash
docker-compose logs -f rabin-voice
```

---

## 🔧 دستورات مفید دیگر

### بررسی وضعیت کانتینر
```bash
docker-compose ps rabin-voice
```

### توقف سرویس
```bash
docker-compose stop rabin-voice
```

### شروع سرویس
```bash
docker-compose start rabin-voice
```

### حذف و ساخت مجدد
```bash
docker-compose down rabin-voice
docker-compose up -d --build rabin-voice
```

### ورود به کانتینر (برای دیباگ)
```bash
docker-compose exec rabin-voice sh
```

### بررسی استفاده از منابع
```bash
docker stats rabin-voice
```

---

## 🌐 دسترسی‌ها

- **وب**: https://crm.robintejarat.com/rabin-voice
- **پورت محلی**: http://localhost:3001
- **API هوش مصنوعی**: https://crm.robintejarat.com/rabin-voice/api/ai
- **API تبدیل متن به صدا**: https://crm.robintejarat.com/rabin-voice/api/tts

---

## ⚠️ نکات مهم

### چرا باید Nginx را ری‌استارت کنیم؟

وقتی کانتینر `rabin-voice` را ری‌استارت می‌کنید:
1. **IP داخلی تغییر می‌کند**: Docker ممکن است IP جدیدی به کانتینر اختصاص دهد
2. **اتصال Nginx قطع می‌شود**: Nginx هنوز به IP قدیمی متصل است
3. **دامنه کار نمی‌کند**: درخواست‌ها به IP قدیمی ارسال می‌شوند و خطا می‌دهند

**راه حل:** ری‌استارت Nginx تا اتصال جدید برقرار شود

### تفاوت اسکریپت‌ها

| اسکریپت | زمان | Rebuild | Nginx Restart | کاربرد |
|---------|------|---------|---------------|--------|
| `restart-rabin-voice.sh` | 3-5 دقیقه | ✅ بله | ✅ بله | تغییرات کد، مشکلات جدی |
| `quick-restart-rabin-voice.sh` | 15-20 ثانیه | ❌ خیر | ✅ بله | تغییرات .env، ری‌استارت سریع |
| `status-rabin-voice.sh` | 5 ثانیه | ❌ خیر | ❌ خیر | بررسی وضعیت فعلی |

---

## 🐛 عیب‌یابی

### مشکل: سرویس راه‌اندازی نمی‌شود
```bash
# بررسی لاگ‌ها
docker-compose logs --tail=100 rabin-voice

# بررسی فایل .env
cat "صدای رابین/.env"

# ری‌استارت کامل
./restart-rabin-voice.sh
```

### مشکل: خطای API هوش مصنوعی
```bash
# بررسی کلید API در .env
grep OPENROUTER_API_KEY "صدای رابین/.env"

# تست API
curl -X POST https://crm.robintejarat.com/rabin-voice/api/ai \
  -H "Content-Type: application/json" \
  -d '{"userMessage":"سلام"}'
```

### مشکل: خطای 502 Bad Gateway
```bash
# بررسی وضعیت کانتینر
docker-compose ps rabin-voice

# بررسی پورت
nc -z localhost 3001

# ری‌استارت Nginx
docker-compose restart nginx
# یا
sudo systemctl reload nginx
```

### مشکل: حافظه کم
```bash
# بررسی استفاده از حافظه
docker stats rabin-voice

# پاکسازی cache
cd "صدای رابین"
rm -rf .next node_modules/.cache .swc
cd ..

# ری‌استارت
./restart-rabin-voice.sh
```

---

## 📝 نکات مهم

1. **قبل از ری‌استارت**: همیشه لاگ‌ها را بررسی کنید
2. **فایل .env**: مطمئن شوید کلید API معتبر است
3. **پورت 3001**: باید آزاد باشد
4. **Nginx**: باید به درستی تنظیم شده باشد
5. **حافظه**: حداقل 512MB RAM نیاز است

---

## 🔐 امنیت

- کلید API را در `.env` نگه دارید
- `.env` را در `.gitignore` قرار دهید
- از HTTPS برای دسترسی استفاده کنید
- لاگ‌ها را به صورت دوره‌ای پاک کنید

---

## 📞 پشتیبانی

اگر مشکلی وجود دارد:
1. لاگ‌ها را بررسی کنید
2. فایل `.env` را چک کنید
3. وضعیت کانتینر را بررسی کنید
4. اسکریپت ری‌استارت کامل را اجرا کنید