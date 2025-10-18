# رفع خطای toFixed در صفحه مانیتورینگ

## تاریخ: 1403/07/26 - ساعت 20:15

---

## ❌ خطا:

```
TypeError: (satisfaction.avg_score || 0).toFixed is not a function
```

**محل خطا:** خط 357 در `app/[tenant_key]/dashboard/system-monitoring/page.tsx`

---

## 🔍 علت:

مقدار `satisfaction.avg_score` از دیتابیس به صورت **string** برمی‌گردد، نه number.

وقتی از `||` استفاده می‌کنیم:
```typescript
(satisfaction.avg_score || 0).toFixed(1)
```

اگر `avg_score` یک string باشد (مثلاً `"3.5"`), عملگر `||` آن را truthy می‌بیند و string را برمی‌گرداند، نه 0.
و string متد `toFixed` ندارد!

---

## ✅ راه حل:

### قبل:
```typescript
const satisfaction = data.satisfaction || {};
const satisfactionRate = satisfaction.total_customers > 0
  ? ((satisfaction.satisfied / satisfaction.total_customers) * 100).toFixed(1)
  : 0;

// و در JSX:
{(satisfaction.avg_score || 0).toFixed(1)}
```

### بعد:
```typescript
const satisfaction = data.satisfaction || {};
const avgScore = parseFloat(satisfaction.avg_score) || 0;
const satisfactionRate = satisfaction.total_customers > 0
  ? ((satisfaction.satisfied / satisfaction.total_customers) * 100).toFixed(1)
  : 0;

// و در JSX:
{avgScore.toFixed(1)}
```

---

## 🔧 تغییرات:

### 1. تعریف متغیر avgScore:
```typescript
const avgScore = parseFloat(satisfaction.avg_score) || 0;
```

این کار:
- ✅ string را به number تبدیل می‌کند
- ✅ اگر NaN بود، 0 برمی‌گرداند
- ✅ اگر null یا undefined بود، 0 برمی‌گرداند

### 2. استفاده از avgScore در JSX:
```typescript
// میانگین رضایت
{avgScore.toFixed(1)}

// ستاره‌ها
{star <= Math.round(avgScore) ? '...' : '...'}
```

---

## ✅ نتیجه:

خطا برطرف شد و صفحه مانیتورینگ به درستی کار می‌کند!

**لینک:**
```
http://localhost:3000/rabin/dashboard/system-monitoring
```

---

## 💡 درس آموخته:

همیشه مقادیر از دیتابیس را به نوع صحیح تبدیل کنید:
- `parseInt()` برای اعداد صحیح
- `parseFloat()` برای اعداد اعشاری
- `Number()` برای تبدیل عمومی

و همیشه fallback مناسب داشته باشید:
```typescript
const value = parseFloat(data.value) || 0;
```

🎉 **آماده استفاده!**
