# 🚀 راهنمای سریع دیپلوی

## ⚡ دستورات سریع

### روی لوکال (ویندوز):
```powershell
npm run fix-before-deploy
```

### روی سرور (لینوکس):
```bash
bash setup-all-env.sh
bash deploy-server.sh
```

---

## 📋 چک‌لیست دیپلوی

- [ ] روی لوکال: `npm run fix-before-deploy` اجرا شد
- [ ] فایل `DEPLOY-READY.md` بررسی شد
- [ ] فایل‌ها به سرور آپلود شدند
- [ ] روی سرور: `bash setup-all-env.sh` اجرا شد
- [ ] روی سرور: `bash deploy-server.sh` اجرا شد
- [ ] سایت تست شد: `http://crm.robintejarat.com`
- [ ] Rabin Voice تست شد: `http://crm.robintejarat.com/rabin-voice`

---

## 🔧 مشکلات رایج

### مشکل 1: `rabin-voice could not be resolved`
**راه حل:** اسکریپت `fix-before-deploy` این مشکل را حل می‌کند

### مشکل 2: `Access denied for user 'root'@'localhost'`
**راه حل:** اسکریپت `fix-before-deploy` پسوردها را یکسان می‌کند

### مشکل 3: `Cannot find module '/app/.next/standalone/server.js'`
**راه حل:** اسکریپت `fix-before-deploy` مسیر را تصحیح می‌کند

### مشکل 4: `OPENROUTER_API_KEY not set`
**راه حل:** اسکریپت `fix-before-deploy` API Key را تنظیم می‌کند

---

## 📞 پشتیبانی

اگر مشکلی پیش آمد:
1. فایل `DEPLOY-READY.md` را بررسی کنید
2. لاگ‌های سرور را چک کنید: `docker-compose logs -f`
3. اسکریپت `check-env-consistency.sh` را اجرا کنید

---

✅ **همه چیز آماده است!**
