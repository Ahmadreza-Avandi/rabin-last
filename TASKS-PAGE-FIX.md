# 🔧 Tasks Page Redirect to Login - Fix Guide

## 🚨 Problem

User logs in successfully but when navigating to `/rabin/dashboard/tasks`, they get redirected back to login instead of seeing the tasks page.

## 🔍 Root Causes Identified

1. **Token not persisting**: Cookies are set after login but may not persist across page navigations
2. **Token not stored in localStorage**: No fallback storage for token
3. **Missing token in response**: Frontend can't store token if not included in login response
4. **Poor error logging**: Hard to debug what's happening

## ✅ Fixes Applied

### 1. **Enhanced Token Retrieval** (`lib/auth-utils.ts`)
- Now checks multiple sources: `auth-token` cookie, `tenant_token` cookie, localStorage
- Added detailed logging to help debug token issues
- Better error handling

### 2. **Token Backup in localStorage** (`components/auth/TenantLoginForm.tsx`)
- After successful login, token is stored in localStorage as backup
- User info is also stored for quick access
- Added console logging for debugging

### 3. **Token in Response** (`app/api/tenant/auth/login/route.ts`)
- Login endpoint now returns `token` field in JSON response
- Frontend can store this token immediately after login

### 4. **Better Error Logging** (`app/api/auth/me/route.ts`)
- `/api/auth/me` now logs detailed information about:
  - Whether Authorization header is present
  - Which cookies are available
  - Why authentication failed

---

## 🚀 Testing Steps

### Step 1: Restart Dev Server
```bash
npm run dev
```

### Step 2: Clear Cookies (Optional but Recommended)
1. Open browser DevTools (F12)
2. Go to Application → Cookies → Delete all cookies from localhost
3. Refresh the page

### Step 3: Test Login
1. Navigate to: `http://localhost:3000/rabin/login`
2. Enter credentials
3. Click "ورود به سیستم"
4. **In browser console, you should see:**
   ```
   ✅ Auth token found in cookie
   ✅ Token stored in localStorage
   ✅ User info stored in localStorage
   ✅ Login successful, redirecting to dashboard...
   ```

### Step 4: Test Tasks Page
1. After login, click on Tasks in the sidebar
2. Or navigate directly to: `http://localhost:3000/rabin/dashboard/tasks`
3. **You should NOT be redirected to login**
4. **In browser console, you should see:**
   ```
   ✅ Auth token found in cookie
   ✅ Auth Response Status: 200
   ✅ User found in auth/me: [user-id] [email]
   ```

### Step 5: Test Page Reload
1. On the tasks page, press F5 to reload
2. **You should NOT be redirected to login**
3. The page should load your tasks

---

## 🧪 Debugging If Still Not Working

### Check Browser Console for Errors
Open DevTools (F12) → Console tab and look for any red errors

### Check Server Console
The dev server console should show:
```
🔍 /api/auth/me called
Authorization header present: true
✅ User found in auth/me: [user-id] [email]
```

### Check Cookies
1. Open DevTools (F12)
2. Go to Application → Cookies
3. You should see:
   - `auth-token` cookie (with JWT token)
   - `tenant_token` cookie (same JWT token)

### Check localStorage
1. Open DevTools (F12)
2. Go to Application → localStorage
3. You should see:
   - `auth-token` (JWT token)
   - `currentUser` (JSON user object)

---

## 📝 Common Issues & Solutions

### Issue: "No auth token found"
**Solution:**
1. Make sure you logged in successfully (no error message)
2. Check browser console for "✅ Token stored" messages
3. Check Application → Cookies for auth-token
4. Clear cookies and try logging in again

### Issue: "Auth Response Status: 401"
**Server returned 401 (unauthorized)**
- Check server console output
- Token might be expired or malformed
- Try logging in again

### Issue: "Redirects to login on page reload"
**Tokens not persisting:**
- Check if cookies are set (DevTools → Application → Cookies)
- Check if localStorage has auth-token (DevTools → Application → localStorage)
- Try clearing all storage and logging in again

### Issue: Still getting 500 errors on activities API
**This is a separate collation issue:**
- Run: `node scripts/fix-collation-issue.cjs`
- See `COLLATION-FIX-GUIDE.md` for details

---

## 📊 What Changed

### Code Files Modified
1. ✅ `lib/auth-utils.ts` - Enhanced token retrieval
2. ✅ `components/auth/TenantLoginForm.tsx` - Token storage + logging
3. ✅ `app/api/tenant/auth/login/route.ts` - Token in response
4. ✅ `app/api/auth/me/route.ts` - Better error logging

### New Scripts Created
- `scripts/test-tasks-auth.cjs` - Test authentication flow

---

## 🔐 How Authentication Works Now

```
1. User logs in
   ↓
2. Credentials sent to /api/tenant/auth/login
   ↓
3. Backend validates and creates JWT token
   ↓
4. Response includes:
   - Cookies (auth-token, tenant_token)
   - JSON with token field
   ↓
5. Frontend stores token in:
   - localStorage (as backup)
   - Cookie already set by server
   ↓
6. User navigates to /rabin/dashboard/tasks
   ↓
7. Tasks page calls getAuthToken() which finds token
   ↓
8. Makes request to /api/auth/me with Authorization header
   ↓
9. Backend verifies token and returns user data
   ↓
10. Tasks page loads successfully
```

---

## ✨ Additional Improvements Included

- **Better logging**: Console now shows what's happening at each step
- **Multiple fallbacks**: Checks cookies, localStorage, headers for token
- **Error details**: /api/auth/me now returns error info in response
- **Token validation**: Server validates token before allowing access

---

## 🆘 Still Having Issues?

1. **Check server console output** - Most detailed info about what's failing
2. **Check browser console** (F12) - Client-side errors will be logged
3. **Check Application tab** - See what cookies/storage are available
4. **Run diagnostics**: `node scripts/test-tasks-auth.cjs`

If still stuck:
- Make sure you ran `npm run dev` to restart with new changes
- Try clearing all cookies: DevTools → Application → Storage → Clear site data
- Try incognito/private browser window for clean state