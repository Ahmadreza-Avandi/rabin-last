# ⚡ شروع سریع - سیستم صوتی جدید رابین

## 🚀 در 5 دقیقه شروع کنید

### مرحله 1: سرور را شروع کنید
```bash
cd "صدای رابین"
npm install    # اگر قبلاً نشده
npm start
```

### مرحله 2: تست کنید
```bash
# روش 1: cURL
curl -X POST http://localhost:3001/api/tts/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text":"سلام دنیا","speaker":"3"}'

# روش 2: Node.js
node test-tts-new-endpoint.js

# روش 3: Python
python3 -c "
import requests
r = requests.post('http://localhost:3001/api/tts/text-to-speech', 
  json={'text': 'سلام', 'speaker': '3'})
print(r.json())
"
```

---

## 📌 استفاده سریع

### JavaScript
```javascript
async function sayText(text) {
  const res = await fetch('/api/tts/text-to-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, speaker: '3' })
  });
  
  const data = await res.json();
  if (data.success) {
    new Audio(data.audioUrl).play();
    return data.requestId; // برای تتبع
  } else {
    console.error(data.error);
  }
}

// استفاده
await sayText('سلام دنیا');
```

### Python
```python
import requests

def say_text(text, speaker="3"):
    response = requests.post(
        'http://localhost:3001/api/tts/text-to-speech',
        json={'text': text, 'speaker': speaker}
    )
    data = response.json()
    
    if data['success']:
        print(f"Request ID: {data['requestId']}")
        print(f"Audio URL: {data['audioUrl']}")
        return data['audioUrl']
    else:
        print(f"Error: {data['error']}")
        return None

# استفاده
audio_url = say_text('سلام دنیا')
```

---

## 🎨 Response مثال

### موفق ✅
```json
{
  "success": true,
  "audioUrl": "http://localhost:3001/api/tts/stream?u=...",
  "directUrl": "https://partai.gw.isahab.ir/...mp3",
  "checksum": "abc123def456",
  "base64": null,
  "requestId": "a1b2c3d4e5f6g7h8",
  "shamsiDate": "1403/8/24",
  "error": null
}
```

### خطا ❌
```json
{
  "success": false,
  "audioUrl": null,
  "directUrl": null,
  "checksum": null,
  "base64": null,
  "requestId": "a1b2c3d4e5f6g7h8",
  "shamsiDate": "1403/8/24",
  "error": "متن الزامی است"
}
```

---

## 🎤 Speaker ها

```
"1"  = آقا (پسرانه)
"2"  = بچه  
"3"  = خانم (پیشفرض)
```

### مثال
```javascript
// کوئری خانم
await sayText('سلام دنیا', '3');

// کوئری آقا
await sayText('سلام دنیا', '1');

// کوئری بچه
await sayText('سلام دنیا', '2');
```

---

## 🔧 Endpoints

| Endpoint | Method | توضیح |
|----------|--------|-------|
| `/text-to-speech` | POST | ⭐ **جدید (توصیه‌شده)** |
| `/convert` | POST | قدیم (backward compatible) |
| `/stream` | GET | proxy صوتی |
| `/debug/:text` | GET | تست مستقیم |
| `/test-url` | GET | بررسی URL |

---

## ⚡ نکات سریع

### ✅ بهترین شیوه
```javascript
// 1. همیشه success چک کنید
if (!response.success) {
  console.error('Error:', response.error);
}

// 2. RequestID ذخیره کنید
console.log('Tracking ID:', response.requestId);

// 3. directUrl استفاده کنید (سریع‌تر)
new Audio(response.directUrl).play();
```

### ❌ اشتباهات رایج
```javascript
// ❌ بدون Content-Type
fetch('/api/tts/text-to-speech', {
  method: 'POST',
  body: JSON.stringify({ text: 'سلام' })
});

// ❌ فراموش کردن JSON.stringify
fetch('/api/tts/text-to-speech', {
  method: 'POST',
  body: { text: 'سلام' } // ❌ باید string باشد
});

// ❌ بدون error handling
const audio = new Audio(data.audioUrl); // شاید undefined است
await audio.play(); // می‌تواند fail شود
```

---

## 🐛 مشکل‌های رایج

### 🔴 "سرور صوتی در دسترس نیست"
```bash
# بررسی کنید API در دسترس است
curl http://api.ahmadreza-avandi.ir/text-to-speech -v

# یا debug endpoint
curl http://localhost:3001/api/tts/debug/سلام
```

### 🔴 "CORS Error"
- استفاده کنید از `audioUrl` (proxied)
- نه `directUrl`

### 🔴 تاخیر زیاد
- `directUrl` سریع‌تر است
- `audioUrl` (proxy) آرام‌تر است

---

## 📊 تست سریع

```bash
# 9 تست مختلف
node test-tts-new-endpoint.js

# تست مشخص
node test-tts-new-endpoint.js 1

# فهرست تست‌ها
node test-tts-new-endpoint.js list
```

---

## 💡 مثال کامل

### HTML + JavaScript
```html
<!DOCTYPE html>
<html dir="rtl">
<head>
  <title>دستیار صوتی رابین</title>
</head>
<body>
  <input type="text" id="textInput" placeholder="متن را وارد کنید" value="سلام دنیا" />
  <select id="speaker">
    <option value="1">آقا</option>
    <option value="2">بچه</option>
    <option value="3" selected>خانم</option>
  </select>
  <button onclick="speak()">🔊 بگو</button>

  <script>
    async function speak() {
      const text = document.getElementById('textInput').value;
      const speaker = document.getElementById('speaker').value;
      
      if (!text) {
        alert('لطفاً متن وارد کنید');
        return;
      }

      try {
        const response = await fetch('/api/tts/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, speaker })
        });

        const data = await response.json();

        if (data.success) {
          console.log('Request ID:', data.requestId);
          const audio = new Audio(data.audioUrl);
          audio.play();
        } else {
          alert('خطا: ' + data.error);
        }
      } catch (error) {
        alert('خطا: ' + error.message);
      }
    }
  </script>
</body>
</html>
```

---

## 📞 کمک بیشتر

- 📖 **راهنمای کامل:** `TTS-API-GUIDE.md`
- 🎯 **خلاصه بهبودی‌ها:** `TTS-IMPROVEMENTS-SUMMARY.md`
- 🧪 **تست‌ها:** `node test-tts-new-endpoint.js`

---

## ✨ خلاصه

| موضوع | سابق | جدید |
|--------|------|------|
| Endpoint | `/convert` | `/text-to-speech` ⭐ |
| Response Format | غیرمعیار | معیار ✅ |
| Request ID | ❌ | ✅ |
| Logs | ساده | بسیار بهتر |
| Error Details | کم | زیادی |
| Documentation | ❌ | ✅ |
| Test Suite | ❌ | ✅ |

---

## 🎊 شروع کنید!

```bash
# 1. سرور را شروع کنید
npm start

# 2. یک endpoint تست کنید
curl -X POST http://localhost:3001/api/tts/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text":"سلام دنیا","speaker":"3"}'

# 3. نتیجه را دیدید ✅
```

**بدون نیاز به تغییرات دیگری - آماده برای استفاده! 🚀**