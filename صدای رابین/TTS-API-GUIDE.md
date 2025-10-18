# 🎵 صدای رابین - راهنمای API صوتی

## بروزرسانی‌های جدید

### ✨ Endpoint جدید: POST /text-to-speech

**این endpoint جدید است و استاندارد است.**

#### مشخصات:
- **URL:** `POST http://localhost:3001/api/tts/text-to-speech`
- **Content-Type:** `application/json`

#### درخواست:
```json
{
  "text": "سلام از نمونه",
  "speaker": "3"
}
```

#### پاسخ موفق:
```json
{
  "success": true,
  "audioUrl": "http://localhost:3001/api/tts/stream?u=...",
  "directUrl": "https://partai.gw.isahab.ir/...mp3",
  "checksum": "abc123...",
  "base64": null,
  "requestId": "a1b2c3d4e5f6g7h8",
  "shamsiDate": "1403/8/24",
  "error": null
}
```

#### پاسخ خطا:
```json
{
  "success": false,
  "audioUrl": null,
  "directUrl": null,
  "checksum": null,
  "base64": null,
  "requestId": "a1b2c3d4e5f6g7h8",
  "shamsiDate": "1403/8/24",
  "error": "نام‌های متغیر الزامی است"
}
```

---

## Endpoints

### 1️⃣ POST /text-to-speech ⭐ (جدید - توصیه‌شده)

```bash
curl -X POST http://localhost:3001/api/tts/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text":"سلام دنیا","speaker":"3"}'
```

**مزایا:**
- ✅ فرمت پاسخ استاندارد
- ✅ شامل requestId و تاریخ شمسی
- ✅ معلومات خطا بهتر
- ✅ لاگ‌های بهتری برای debug

---

### 2️⃣ POST /convert (میراث - برای تطابق)

```bash
curl -X POST http://localhost:3001/api/tts/convert \
  -H "Content-Type: application/json" \
  -d '{"text":"سلام دنیا"}'
```

**توجه:** این endpoint برای تطابق با کد قدیم است. از `/text-to-speech` استفاده کنید.

---

### 3️⃣ GET /stream (جریان صوتی)

برای proxy کردن URL صوتی از طریق سرور:

```bash
# استفاده شده توسط audioUrl در endpoint‌های دیگر
curl http://localhost:3001/api/tts/stream?u=https%3A%2F%2Fpartai.gw.isahab.ir%2F...mp3
```

---

### 4️⃣ GET /debug/:text (Debug)

برای تست مستقیم API:

```bash
curl http://localhost:3001/api/tts/debug/سلام%20دنیا
```

**پاسخ:**
```json
{
  "success": true,
  "requestId": "...",
  "apiResponse": { /* کامل API response */ },
  "status": 200,
  "responseKeys": ["audioUrl", "directUrl", ...]
}
```

---

### 5️⃣ GET /test-url (تست URL)

برای بررسی آیا یک URL صوتی قابل دسترس است:

```bash
curl "http://localhost:3001/api/tts/test-url?url=https%3A%2F%2Fpartai.gw.isahab.ir%2F...mp3"
```

**پاسخ:**
```json
{
  "success": true,
  "requestId": "...",
  "status": 200,
  "contentType": "audio/mpeg",
  "contentLength": "123456",
  "accessible": true
}
```

---

## 📝 نمونه‌های عملی

### Python

```python
import requests

url = "http://localhost:3001/api/tts/text-to-speech"
data = {
    "text": "سلام دنیا",
    "speaker": "3"
}

response = requests.post(url, json=data)
result = response.json()

if result['success']:
    print(f"Audio URL: {result['audioUrl']}")
    print(f"Request ID: {result['requestId']}")
else:
    print(f"Error: {result['error']}")
```

### JavaScript (Frontend)

```javascript
async function textToSpeech(text, speaker = "3") {
  try {
    const response = await fetch('/api/tts/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, speaker })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Audio URL:', data.audioUrl);
      console.log('Request ID:', data.requestId);
      
      // پخش صدا
      const audio = new Audio(data.audioUrl);
      await audio.play();
    } else {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// استفاده
await textToSpeech('سلام دنیا');
```

### Node.js

```javascript
const axios = require('axios');

async function textToSpeech(text, speaker = "3") {
  try {
    const response = await axios.post('http://localhost:3001/api/tts/text-to-speech', {
      text,
      speaker
    });

    console.log('Success:', response.data.success);
    console.log('Audio URL:', response.data.audioUrl);
    console.log('Request ID:', response.data.requestId);
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// استفاده
await textToSpeech('سلام دنیا');
```

---

## 🔍 لاگ‌های Console

### موفق:
```
📤 TTS Request [a1b2c3d4]
Text: سلام دنیا
Speaker: 3
Text Length: 10
🔗 TTS API URL: http://api.ahmadreza-avandi.ir/text-to-speech
✅ TTS API Response [250ms]
HTTP Status: 200
Response Data: {...}
📝 Using direct response format
🎵 Audio URL: https://partai.gw.isahab.ir/...mp3
✅ Direct URL accessibility test passed: 200
📨 Sending response: {...}
```

### خطا:
```
❌ TTS Request Failed
Error Message: Network Error
Error Code: ECONNREFUSED
HTTP Status: undefined
Response Data: undefined
Additional Info: {
  "requestId": "a1b2c3d4",
  "text": "سلام دنیا",
  "speaker": "3"
}
Stack: Error: connect ECONNREFUSED 127.0.0.1:80
    at TCPConnectWrap.afterConnect
```

---

## ⚙️ متغیرهای محیطی

```env
# فایل .env
PORT=3001
TTS_API_URL=http://api.ahmadreza-avandi.ir/text-to-speech
LOG_LEVEL=INFO
```

---

## 🎯 بهترین شیوه‌ها

1. **همیشه requestId چک کنید:**
   ```javascript
   if (response.requestId) {
     // برای تتبع و debug
     console.log('Request tracked:', response.requestId);
   }
   ```

2. **خطا‌ها را با logError هندل کنید:**
   ```javascript
   if (!response.success) {
     console.error('TTS Error:', response.error);
     // دوباره تلاش یا نمایش پیام
   }
   ```

3. **صبر کنید برای proxied URLs:**
   - اگر audioUrl از طریق `/stream` proxy شده است، مقداری تاخیر طبیعی است

4. **چک کنید speaker صحیح است:**
   - speaker "3" - خانم (پیشفرض)
   - speaker "1" - آقا
   - speaker "2" - بچه

---

## 📊 درخواست‌های نمونه

### cURL

```bash
# Test شماره 1
curl -v -X POST http://localhost:3001/api/tts/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text":"سلام","speaker":"3"}' | jq .

# Test شماره 2
curl -v -X POST http://localhost:3001/api/tts/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text":"متن بلند برای تست است","speaker":"1"}' | jq .

# Debug
curl http://localhost:3001/api/tts/debug/سلام | jq .
```

---

## 🐛 مشکل‌شناسی

### مشکل: "سرور صوتی در دسترس نیست"

**راه حل:**
```bash
# چک کنید API دسترس‌پذیر است
curl http://api.ahmadreza-avandi.ir/text-to-speech -v

# یا از debug endpoint استفاده کنید
curl http://localhost:3001/api/tts/debug/تست
```

### مشکل: تاخیر در پخش

**راه حل:**
- اگر audioUrl از /stream است، تاخیر طبیعی است
- directUrl سریع‌تر است اما ممکن است CORS issue داشته باشد
- proxied URL قابل‌اعتمادتر است

### مشکل: requestId undefined

**راه حل:**
```javascript
// حتماً موفق بودن response را چک کنید
if (!response.success) {
  console.log('Request ID:', response.requestId);
  console.log('Error:', response.error);
}
```

---

## 📞 پشتیبانی

برای دریافت کمک بیشتر:
1. لاگ‌های console را بررسی کنید
2. debug endpoint را استفاده کنید
3. test-url endpoint را برای بررسی URL صوتی استفاده کنید