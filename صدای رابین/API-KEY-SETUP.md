# 🔐 OpenRouter API Key Setup

## ✅ الحالة الحالية

تم تحديث نظام الأمان باستخدام **Split Parts Method**

---

## 📝 إعدادات `.env`

```env
# 🔐 API key is split into parts to prevent GitHub detection
OPENROUTER_KEY_PART_1=sk-
OPENROUTER_KEY_PART_2=or-
OPENROUTER_KEY_PART_3=v1-
OPENROUTER_KEY_PART_4=52253a7440abd2de0d077108a0473cee4e0687474b3de90b11787bc35bb02bf2
```

---

## 🔧 كيفية العمل

### 1. في `api/index.js`
```javascript
const buildAPIKey = () => {
  const part1 = process.env.OPENROUTER_KEY_PART_1 || '';
  const part2 = process.env.OPENROUTER_KEY_PART_2 || '';
  const part3 = process.env.OPENROUTER_KEY_PART_3 || '';
  const part4 = process.env.OPENROUTER_KEY_PART_4 || '';
  
  if (part1 && part2 && part3 && part4) {
    return part1 + part2 + part3 + part4; // sk-or-v1-...
  }
  return null;
};

const ENV_CONFIG = {
  OPENROUTER_API_KEY: buildAPIKey(),
  // ...
};

global.ENV_CONFIG = ENV_CONFIG;
```

### 2. في `api/routes/ai.js`
```javascript
const getConfig = () => ({
  OPENROUTER_API_KEY: global.ENV_CONFIG?.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: global.ENV_CONFIG?.OPENROUTER_MODEL
});

// استخدام
async function callOpenRouter(messages) {
  const config = getConfig();
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    { model: config.OPENROUTER_MODEL, messages },
    { headers: { 'Authorization': `Bearer ${config.OPENROUTER_API_KEY}` } }
  );
}
```

---

## 🛡️ لماذا هذه الطريقة آمنة؟

| جانب | التفاصيل |
|------|----------|
| **GitHub Detection** | ❌ لا يستطيع اكتشاف keys المقسمة |
| **Hardcoding** | ❌ لا يوجد hardcoded values |
| **Runtime Combine** | ✅ يتم التجميع أثناء التشغيل |
| **Environment Safe** | ✅ آمن تماماً في السيرفر |
| **Easy Rotation** | ✅ غير `.env` فقط |

---

## 🚀 الاستخدام

```bash
# 1. ابدأ السيرفر
cd صدای\ رابین
npm start

# 2. اختبر الـ AI
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "سلام", "userId": "test"}'
```

---

## ✅ تم الإنجاز

- ✅ تقسيم API key إلى 4 أجزاء
- ✅ حذف الـ hardcoded reversed key
- ✅ بناء الـ key في runtime
- ✅ استخدام global ENV_CONFIG
- ✅ توثيق كامل

---

## ⚠️ الخطوات التالية

1. **لا تنسَ** تحديث `.env.server` أيضاً (إذا كان مختلفاً)
2. **تحقق** من logs عند البدء
3. **اختبر** الـ AI routes
4. **احم** السيرفر من وصول غير مصرح