const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

// Helper function for better error logging
const logError = (title, error, additionalInfo = {}) => {
  console.error(`\n❌ ${title}`);
  console.error('Error Message:', error.message);
  console.error('Error Code:', error.code);
  if (error.response) {
    console.error('HTTP Status:', error.response.status);
    console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
  }
  if (Object.keys(additionalInfo).length > 0) {
    console.error('Additional Info:', JSON.stringify(additionalInfo, null, 2));
  }
  console.error('Stack:', error.stack?.split('\n').slice(0, 3).join('\n'));
  console.error('---\n');
};

// Helper function for shamsi date
const getShamsiDate = () => {
  const d = new Date();
  // Simple conversion (for production use moment-jalaali)
  return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
};

// Generate request ID
const generateRequestId = () => crypto.randomBytes(8).toString('hex');

// New standard endpoint: POST /text-to-speech
router.post('/text-to-speech', async (req, res) => {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    const { text, speaker = '3' } = req.body;

    if (!text) {
      console.warn('⚠️ TTS Request - Missing text field');
      return res.status(400).json({
        success: false,
        error: 'متن الزامی است',
        audioUrl: null,
        directUrl: null,
        checksum: null,
        base64: null,
        requestId,
        shamsiDate: getShamsiDate(),
        errorCode: 'MISSING_TEXT'
      });
    }

    console.log(`\n📤 TTS Request [${requestId}]`);
    console.log('Text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    console.log('Speaker:', speaker);
    console.log('Text Length:', text.length);

    const ttsUrl = 'http://api.ahmadreza-avandi.ir/text-to-speech';
    console.log('🔗 TTS API URL:', ttsUrl);

    const response = await axios.post(ttsUrl, {
      text: text,
      speaker: String(speaker),
      checksum: "1",
      filePath: "true",
      base64: "0"
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Dastyar-Robin/1.0'
      }
    });

    const duration = Date.now() - startTime;
    console.log(`✅ TTS API Response [${duration}ms]`);
    console.log('HTTP Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    // Extract audio URL from response
    let audioUrl = null;
    let checksum = null;
    let directUrl = null;

    if (response.data && response.data.audioUrl) {
      // Response is already in the desired format
      audioUrl = response.data.audioUrl;
      directUrl = response.data.directUrl;
      checksum = response.data.checksum;
      console.log('📝 Using direct response format');
    } else if (response.data && response.data.data && response.data.data.status === 'success' && response.data.data.data) {
      // Legacy nested format
      const filePath = response.data.data.data.filePath;
      directUrl = filePath.startsWith('http') ? filePath : `https://${filePath}`;
      checksum = response.data.data.data.checksum;
      console.log('📝 Using legacy nested format');
      console.log('Extracted filePath:', filePath);
    } else {
      logError('Unexpected TTS API Response Structure', new Error('Invalid response'), {
        responseKeys: Object.keys(response.data || {}),
        responseData: response.data
      });
      throw new Error('خطا در تبدیل متن به صدا - ساختار پاسخ نامعتبر');
    }

    if (!directUrl) {
      logError('No Audio URL Found', new Error('Missing audio URL'), { response: response.data });
      throw new Error('خطا در دریافت آدرس صوتی');
    }

    console.log('🎵 Audio URL:', directUrl);

    // Test if we can access the URL
    try {
      const testResponse = await axios.head(directUrl, { timeout: 5000 });
      console.log('✅ Direct URL accessibility test passed:', testResponse.status);
      audioUrl = directUrl;
    } catch (testError) {
      console.warn('⚠️ Direct URL test failed:', testError.message);
      console.log('Attempting to use proxy URL...');
      audioUrl = `${req.protocol}://${req.get('host')}/api/tts/stream?u=${encodeURIComponent(directUrl)}`;
      console.log('📡 Using proxied URL:', audioUrl);
    }

    const successResponse = {
      success: true,
      audioUrl: audioUrl,
      directUrl: directUrl,
      checksum: checksum || null,
      base64: null,
      requestId: requestId,
      shamsiDate: getShamsiDate(),
      error: null
    };

    console.log('📨 Sending response:', JSON.stringify(successResponse, null, 2));
    res.json(successResponse);

  } catch (error) {
    logError('TTS Request Failed', error, {
      requestId,
      text: req.body.text?.substring(0, 50),
      speaker: req.body.speaker
    });

    const errorResponse = {
      success: false,
      audioUrl: null,
      directUrl: null,
      checksum: null,
      base64: null,
      requestId: requestId,
      shamsiDate: getShamsiDate(),
      error: error.message || 'خطا در تبدیل متن به صدا'
    };

    res.status(error.response?.status || 500).json(errorResponse);
  }
});

// Legacy endpoint: POST /convert (kept for backward compatibility)
router.post('/convert', async (req, res) => {
  const requestId = generateRequestId();
  try {
    const { text } = req.body;
    if (!text) {
      console.warn('⚠️ Convert request - Missing text field');
      return res.status(400).json({ error: 'متن الزامی است' });
    }

    console.log(`\n📤 Convert Request [${requestId}]`);
    console.log('Text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));

    // Call the new endpoint internally
    const ttsUrl = 'http://api.ahmadreza-avandi.ir/text-to-speech';
    console.log('🔗 TTS API URL:', ttsUrl);

    const response = await axios.post(ttsUrl, {
      text: text,
      speaker: "3",
      checksum: "1",
      filePath: "true",
      base64: "0"
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Dastyar-Robin/1.0'
      }
    });

    console.log(`✅ Response received [${Date.now()}]`);

    // Extract URL from response
    let directUrl = null;
    let checksum = null;

    if (response.data && response.data.data && response.data.data.status === 'success' && response.data.data.data) {
      const filePath = response.data.data.data.filePath;
      directUrl = filePath.startsWith('http') ? filePath : `https://${filePath}`;
      checksum = response.data.data.data.checksum;
      console.log('Extracted file path:', filePath);
    } else {
      logError('Unexpected response structure in /convert', new Error('Invalid response'), { response: response.data });
      throw new Error('خطا در تبدیل متن به صدا - ساختار پاسخ نامعتبر');
    }

    // Test URL accessibility
    try {
      const testResponse = await axios.head(directUrl, { timeout: 5000 });
      console.log('✅ Direct URL test passed:', testResponse.status);
      const proxyUrl = `${req.protocol}://${req.get('host')}/api/tts/stream?u=${encodeURIComponent(directUrl)}`;
      res.json({
        success: true,
        audioUrl: proxyUrl,
        directUrl: directUrl,
        checksum: checksum
      });
    } catch (testError) {
      console.warn('⚠️ Direct URL test failed, using direct URL');
      res.json({
        success: true,
        audioUrl: directUrl,
        directUrl: directUrl,
        checksum: checksum,
        note: 'Using direct URL due to accessibility test failure'
      });
    }

  } catch (error) {
    logError('Convert endpoint failed', error, { requestId });
    res.status(500).json({
      error: 'خطا در تبدیل متن به صدا',
      success: false,
      requestId: requestId
    });
  }
});

// Stream/proxy external audio URL through our server for same-origin playback
router.get('/stream', async (req, res) => {
  const targetUrl = req.query.u;
  if (!targetUrl || typeof targetUrl !== 'string') {
    console.warn('⚠️ Stream request - Missing target URL');
    return res.status(400).send('Missing target URL');
  }

  try {
    console.log(`\n📡 Streaming audio [${generateRequestId()}]`);
    console.log('Target URL:', targetUrl.substring(0, 80) + '...');

    // First try to get the file with a simple request
    const upstream = await axios({
      method: 'GET',
      url: targetUrl,
      responseType: 'stream',
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
      },
      maxRedirects: 10,
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      },
      // Add proxy settings if needed
      proxy: false
    });

    console.log(`✅ Upstream connection established [${upstream.status}]`);
    console.log('Content-Type:', upstream.headers['content-type']);
    console.log('Content-Length:', upstream.headers['content-length'] || 'unknown');

    // Set CORS headers for audio playback
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

    // Forward essential headers
    res.setHeader('Content-Type', upstream.headers['content-type'] || 'audio/mpeg');
    if (upstream.headers['content-length']) {
      res.setHeader('Content-Length', upstream.headers['content-length']);
    }
    if (upstream.headers['accept-ranges']) {
      res.setHeader('Accept-Ranges', upstream.headers['accept-ranges']);
    }

    // Handle range requests for audio seeking
    if (req.headers.range && upstream.headers['accept-ranges']) {
      res.setHeader('Content-Range', upstream.headers['content-range'] || '');
      res.status(206);
      console.log('📍 Range request detected, using partial content (206)');
    }

    upstream.data.pipe(res);

    upstream.data.on('end', () => {
      console.log('✅ Audio stream completed successfully');
    });

    upstream.data.on('error', (err) => {
      logError('Stream data error', err);
    });

  } catch (err) {
    logError('Proxy stream error', err, {
      targetUrl: targetUrl.substring(0, 80),
      code: err.code
    });

    if (!res.headersSent) {
      res.status(502).json({
        error: 'Failed to fetch audio',
        message: 'سرور صوتی در دسترس نیست',
        code: err.code,
        url: targetUrl
      });
    }
  }
});

// Handle OPTIONS requests for CORS
router.options('/stream', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.status(200).end();
});

// Debug route to test TTS API directly
router.get('/debug/:text', async (req, res) => {
  const requestId = generateRequestId();
  try {
    const text = decodeURIComponent(req.params.text);
    console.log(`\n🐛 Debug TTS Request [${requestId}]`);
    console.log('Text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));

    const ttsUrl = 'http://api.ahmadreza-avandi.ir/text-to-speech';
    console.log('🔗 API URL:', ttsUrl);

    const response = await axios.post(ttsUrl, {
      text: text,
      speaker: "3",
      checksum: "1",
      filePath: "true",
      base64: "0"
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Dastyar-Robin/1.0'
      }
    });

    console.log('✅ Debug response received');
    res.json({
      success: true,
      requestId: requestId,
      apiResponse: response.data,
      status: response.status,
      responseKeys: Object.keys(response.data || {})
    });

  } catch (error) {
    logError('Debug TTS request failed', error, { requestId });
    res.status(500).json({
      success: false,
      requestId: requestId,
      error: error.message,
      response: error.response?.data,
      code: error.code
    });
  }
});

// Test route to check if audio URL is accessible
router.get('/test-url', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    console.warn('⚠️ Test URL - Missing URL parameter');
    return res.status(400).json({ error: 'URL parameter required' });
  }

  const requestId = generateRequestId();
  try {
    console.log(`\n🧪 Testing URL Accessibility [${requestId}]`);
    console.log('URL:', url.substring(0, 80) + '...');

    const response = await axios.head(url, { timeout: 10000 });

    console.log(`✅ URL test passed [${response.status}]`);
    res.json({
      success: true,
      requestId: requestId,
      status: response.status,
      contentType: response.headers['content-type'],
      contentLength: response.headers['content-length'],
      accessible: true
    });
  } catch (error) {
    logError('URL test failed', error, { requestId, url: url.substring(0, 80) });
    res.json({
      success: false,
      requestId: requestId,
      error: error.message,
      code: error.code,
      accessible: false
    });
  }
});

module.exports = router;