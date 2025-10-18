# Verification Checklist - API Fixes

## Changes Applied ✅

### 1. ProductSelector Component Updated
- ✅ Added `tenantKey` prop to interface
- ✅ Added authentication token extraction from cookies
- ✅ Updated endpoint from `/api/products` → `/api/tenant/products`
- ✅ Added proper headers: `X-Tenant-Key` and `Authorization`
- **File**: `components/ui/product-selector.tsx`

### 2. Activities Page Fixed
- ✅ Added `useParams()` hook invocation
- ✅ Extracted `tenantKey` from route parameters
- ✅ Now available for all async functions
- **File**: `app/[tenant_key]/dashboard/activities/page.tsx`

### 3. Customer Detail API Created
- ✅ New endpoint: `/api/tenant/customers/[id]`
- ✅ Fetches customer data with authentication
- ✅ Includes related activities, contacts, and sales
- ✅ Maintains tenant isolation
- **File**: `app/api/tenant/customers/[id]/route.ts` (NEW)

### 4. API Endpoints Enhanced
- ✅ Activities API: Added `customerId` filtering
- ✅ Sales API: Added `customer_id` filtering
- **Files**: 
  - `app/api/tenant/activities/route.ts`
  - `app/api/tenant/sales/route.ts`

---

## Step-by-Step Testing

### Step 1: Clear Browser Cache and Cookies
```
1. Open Developer Tools (F12)
2. Go to Application → Cookies
3. Delete all cookies for localhost:3000
4. Close and reopen browser tab
5. Log in again
```

### Step 2: Test Products Loading
```
URL: http://localhost:3000/rabin/dashboard/customers/new
Expected:
- Page loads without errors
- Products list appears in "محصولات مورد علاقه" section
- You can select products
- No 401 errors in Console
```

**Console Check**: Open DevTools → Console
```
Expected: No errors about "tenantKey" or "401"
```

### Step 3: Test Customer Profile
```
URL: http://localhost:3000/rabin/dashboard/customers/[any-customer-id]
Example: http://localhost:3000/rabin/dashboard/customers/bb19a347-ab65-11f0-81d2-581122e4f0be

Expected:
- Customer details display (name, email, phone, etc.)
- Activities section shows customer activities
- Sales section shows customer sales
- No "مشتری یافت نشد" message
```

**Console Check**:
```
Expected: No 404 errors for customer API
```

### Step 4: Test Activities Page
```
URL: http://localhost:3000/rabin/dashboard/activities
Expected:
- Page loads without "ReferenceError: tenantKey is not defined"
- Activities list displays
- Customers dropdown works
- Coworkers list loads
- Can add new activities
```

**Console Check**:
```
Expected: No "tenantKey is not defined" errors
```

### Step 5: Test Sales Page
```
URL: http://localhost:3000/rabin/dashboard/sales
Expected:
- Sales list displays
- Can search for sales
- Can delete sales
- No connection errors
```

---

## Network Tab Testing

Open DevTools → Network tab and verify these calls:

### Call 1: Load Products
```
GET /api/tenant/products
Status: ✅ 200
Headers:
  X-Tenant-Key: rabin
  Authorization: Bearer [token]
Response:
  success: true
  data: [...]
```

### Call 2: Load Customer Detail
```
GET /api/tenant/customers/[id]
Status: ✅ 200
Headers:
  X-Tenant-Key: rabin
  Authorization: Bearer [token]
Response:
  success: true
  data: {
    id: "...",
    name: "...",
    activities: [...],
    contacts: [...],
    sales: [...]
  }
```

### Call 3: Load Activities
```
GET /api/tenant/activities
Status: ✅ 200
Headers:
  X-Tenant-Key: rabin
  Authorization: Bearer [token]
Response:
  success: true
  data: [...]
```

### Call 4: Load Sales
```
GET /api/tenant/sales
Status: ✅ 200
Headers:
  X-Tenant-Key: rabin
  Authorization: Bearer [token]
Response:
  success: true
  data: [...]
  sales: [...]
```

---

## Troubleshooting Guide

### Issue: Still getting 401 Unauthorized

**Cause**: Auth token not being sent or expired
**Solution**:
1. Log out completely
2. Clear all cookies
3. Log in again
4. Check that `auth-token` cookie exists:
   - DevTools → Application → Cookies
   - Should see `auth-token` with a long value

### Issue: "Customer not found" on profile page

**Cause**: Customer doesn't exist or wrong tenant key
**Solution**:
1. Verify customer ID exists
2. Verify customer belongs to 'rabin' tenant
3. Check console for actual error message

### Issue: Products list still empty on customer creation

**Cause**: No products in database or wrong endpoint
**Solution**:
1. Check that products table has data:
   - Go to database and run: `SELECT COUNT(*) FROM products WHERE tenant_key = 'rabin'`
2. Verify endpoint is `/api/tenant/products` (not `/api/products`)
3. Check Network tab for response status

### Issue: Activities page still shows errors

**Cause**: tenantKey not being extracted
**Solution**:
1. Check that `useParams()` is called in the component
2. Verify you're on the correct URL: `/rabin/dashboard/activities`
3. Clear browser cache and reload

---

## Quick Debug Commands

### Check if auth token exists:
```javascript
// Run in browser console
document.cookie
  .split('; ')
  .find(row => row.startsWith('auth-token='))
```

Expected output:
```
"auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Check current tenant:
```javascript
// Run in browser console
window.location.pathname.split('/')[1]
```

Expected output:
```
"rabin"
```

### Test API directly:
```javascript
// Run in browser console
fetch('/api/tenant/products', {
  headers: {
    'X-Tenant-Key': 'rabin',
    'Authorization': `Bearer ${document.cookie.split('; ').find(r => r.startsWith('auth-token=')).split('=')[1]}`
  }
})
.then(r => r.json())
.then(data => console.log(data))
```

---

## Performance Verification

These endpoints should respond quickly:

| Endpoint | Expected Response Time |
|----------|----------------------|
| /api/tenant/products | < 500ms |
| /api/tenant/customers | < 500ms |
| /api/tenant/customers/[id] | < 200ms |
| /api/tenant/activities | < 500ms |
| /api/tenant/sales | < 500ms |

If response time is > 1s, check:
1. Database connection status
2. Network latency (ping localhost)
3. Database query performance

---

## Success Indicators ✅

You'll know everything is working when:

1. ✅ New Customer page loads with products list
2. ✅ Customer profile displays without "نافت نشد" error
3. ✅ Activities page loads activities without errors
4. ✅ Sales page displays sales data
5. ✅ All Network calls return 200 status
6. ✅ No console errors about tenantKey or 401
7. ✅ Can navigate between pages smoothly
8. ✅ Data is correctly filtered by tenant

---

## Rollback Instructions

If you need to revert changes:

```bash
# Revert ProductSelector
git checkout components/ui/product-selector.tsx

# Revert Activities page
git checkout app/[tenant_key]/dashboard/activities/page.tsx

# Delete new customer API
rm app/api/tenant/customers/[id]/route.ts

# Revert API updates
git checkout app/api/tenant/activities/route.ts
git checkout app/api/tenant/sales/route.ts
```

---

## Next Steps

1. **Deploy Changes**: Commit and deploy these files to production
2. **Monitor Logs**: Watch server logs for any errors
3. **User Testing**: Have users test all affected pages
4. **Performance Monitoring**: Monitor API response times
5. **Database Optimization**: Add indexes on tenant_key fields if needed

---

Last Updated: 2025-01-17