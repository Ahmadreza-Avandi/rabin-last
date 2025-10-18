# دستورالعمل تست نهایی

## مراحل تست:

### 1. Restart Dev Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### 2. Clear Browser Completely
1. باز کنید DevTools (F12)
2. بروید به **Application** tab
3. کلیک کنید **Clear site data**
4. یا: Ctrl+Shift+Delete → Clear all

### 3. Login Again
1. برو به: http://localhost:3000/rabin/login
2. Login کن
3. بعد از login، **قبل از رفتن به صفحه دیگر**:

### 4. Check Cookie در Console
در Console browser این را اجرا کن:
```javascript
// چک کردن cookie
console.log('All cookies:', document.cookie);

// چک کردن tenant_token
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('tenant_token='));
console.log('tenant_token:', token);

// اگر token وجود داشت، تست API
if (token) {
  const tokenValue = token.split('=')[1];
  fetch('/api/tenant/users', {
    headers: {
      'Authorization': `Bearer ${tokenValue}`,
      'X-Tenant-Key': 'rabin'
    }
  })
  .then(r => r.json())
  .then(d => console.log('API Response:', d))
  .catch(e => console.error('API Error:', e));
}
```

### 5. اگر token وجود نداشت:

**مشکل از Login API است.** بررسی کن:
1. Network tab → ببین response از `/api/tenant/auth/login`
2. باید `Set-Cookie` header داشته باشد
3. اگر نداشت، مشکل از server است

### 6. اگر token وجود داشت اما API کار نکرد:

**مشکل از middleware یا API route است.** بررسی کن:
1. Console server (terminal) را ببین
2. باید log ببینی: `✅ لاگین موفق - Token و Cookie تنظیم شد`
3. اگر error دیدی، بفرست

## خلاصه تغییرات انجام شده:

### ✅ Files Modified:

1. **app/api/tenant/users/route.ts**
   - از `requireTenantAuth` استفاده می‌کند
   - از `getTenantConnection` استفاده می‌کند
   - Response: `{ success, users }`

2. **app/api/tenant/customers/route.ts**
   - Response: `{ success, customers }`

3. **app/api/tenant/auth/login/route.ts**
   - `secure: false` برای development
   - Log اضافه شد

4. **app/[tenant_key]/dashboard/coworkers/page.tsx**
   - `useParams` و `tenantKey` اضافه شد
   - `X-Tenant-Key` header به fetch ها اضافه شد

5. **app/[tenant_key]/dashboard/customers/page.tsx**
   - `useParams` و `tenantKey` اضافه شد
   - Template literal اصلاح شد
   - از `/api/tenant/customers` استفاده می‌کند

6. **components/layout/tenant-sidebar.tsx**
   - از `ResponsiveSidebar` استفاده می‌کند

7. **components/layout/dashboard-sidebar.tsx**
   - Token و tenant_key به permissions API اضافه شد
   - Fallback menu items

## اگر هنوز کار نکرد:

لطفاً این اطلاعات را بفرست:
1. Screenshot از Console (F12)
2. Screenshot از Network tab
3. Screenshot از Application → Cookies
4. Log های server (terminal)
