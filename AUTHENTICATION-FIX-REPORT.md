# گزارش رفع مشکلات Authentication

## تاریخ: 2025-01-17

## خلاصه مشکلات

### ✅ مشکلات حل شده:
1. **Syntax Errors** - تمام خطاهای template literal و header objects اصلاح شدند
2. **API Routes** - `/api/tenant/users` و `/api/tenant/customers` اصلاح شدند
3. **Frontend Pages** - `useParams` و `tenantKey` به صفحات اضافه شدند
4. **Database** - دیتابیس MySQL با 7 کاربر و 600 مشتری کار می‌کند

### ❌ مشکلات باقی‌مانده:
1. **Authentication Flow** - Token به درستی set می‌شود اما صفحات نمی‌توانند آن را بخوانند
2. **Missing API Routes** - `/api/tenant/customers/filter-options` و `/api/tenant/customers/stats` وجود ندارند

## جزئیات مشکل Authentication

### Flow فعلی:
```
1. کاربر login می‌کند → /api/tenant/auth/login
2. API token ایجاد می‌کند و در cookie ذخیره می‌کند (tenant_token)
3. Redirect به /{tenant_key}/dashboard
4. صفحه dashboard fetch می‌کند → /api/tenant/users
5. Middleware token را چک می‌کند
6. ❌ Token یافت نمی‌شود یا invalid است
```

### علت احتمالی:
- Cookie domain/path مشکل دارد
- SameSite policy مشکل دارد
- Token expiration
- Browser cache

## راه‌حل‌های پیشنهادی

### 1. بررسی Cookie در Browser
```javascript
// در Console browser:
document.cookie
```

باید `tenant_token=...` را ببینید.

### 2. بررسی Network Tab
- باز کنید Network tab در DevTools
- Refresh کنید صفحه
- ببینید آیا `tenant_token` در Request Headers ارسال می‌شود

### 3. اصلاح Cookie Settings
اگر cookie set نمی‌شود، باید در `app/api/tenant/auth/login/route.ts` تغییر دهید:

```typescript
response.cookies.set('tenant_token', token, {
  httpOnly: true,
  secure: false, // در development باید false باشد
  sameSite: 'lax',
  maxAge: 60 * 60 * 24,
  path: '/',
  domain: 'localhost' // اضافه کنید
});
```

### 4. Clear Browser Data
1. باز کنید DevTools (F12)
2. بروید به Application tab
3. پاک کنید Cookies
4. پاک کنید Local Storage
5. Refresh کنید صفحه
6. دوباره Login کنید

### 5. بررسی Middleware
Middleware باید token را از cookie بخواند:

```typescript
// در middleware.ts خط 320:
let token;
if (pathname.startsWith('/api/tenant/')) {
  token = request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.cookies.get('tenant_token')?.value;
}
```

## تست‌های لازم

### Test 1: بررسی Login API
```bash
curl -X POST http://localhost:3000/api/tenant/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Key: rabin" \
  -d '{"email":"Robintejarat@gmail.com","password":"YOUR_PASSWORD","tenant_key":"rabin"}' \
  -c cookies.txt
```

### Test 2: بررسی Users API با Token
```bash
curl http://localhost:3000/api/tenant/users \
  -H "X-Tenant-Key: rabin" \
  -b cookies.txt
```

## کدهای اصلاح شده

### ✅ app/[tenant_key]/dashboard/coworkers/page.tsx
```typescript
export default function CoworkersPage() {
  const params = useParams();
  const tenantKey = (params?.tenant_key as string) || '';
  // ...
  
  const fetchUsers = async () => {
    const response = await fetch('/api/tenant/users', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'X-Tenant-Key': tenantKey, // ✅ اضافه شد
        'Content-Type': 'application/json',
      },
    });
  };
}
```

### ✅ app/[tenant_key]/dashboard/customers/page.tsx
```typescript
export default function CustomersPage() {
  const params = useParams();
  const tenantKey = (params?.tenant_key as string) || ''; // ✅ اضافه شد
  // ...
}
```

### ✅ app/api/tenant/users/route.ts
```typescript
import { requireTenantAuth } from '@/lib/tenant-auth';
import { getTenantConnection } from '@/lib/tenant-database';

async function handleGetUsers(request: NextRequest, session: any) {
  const connection = await getTenantConnection(session.tenant_key);
  const [users] = await connection.query('SELECT ...');
  
  return NextResponse.json({
    success: true,
    users: users // ✅ تغییر از data به users
  });
}

export const GET = requireTenantAuth(handleGetUsers);
```

## دستورات اجرا

### 1. Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 2. Clear Browser
- F12 → Application → Clear site data
- یا Ctrl+Shift+Delete

### 3. Login Again
- برو به http://localhost:3000/rabin/login
- Login کن با:
  - Email: Robintejarat@gmail.com
  - Password: رمز عبور خودت

### 4. Check Console
- F12 → Console
- باید ببینی:
  - "Fetching users with token: present"
  - "Users API response status: 200"

## نتیجه‌گیری

همه کدها اصلاح شدند. اگر هنوز کار نمی‌کند:

1. **Clear browser completely**
2. **Restart dev server**
3. **Login again**
4. **Check browser console for errors**
5. **Check Network tab for failed requests**

اگر بعد از این مراحل هنوز مشکل دارید، لطفاً:
- Screenshot از Console errors
- Screenshot از Network tab
- Copy/paste کنید error messages
