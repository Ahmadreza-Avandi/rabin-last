const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const aiRoutes = require('./routes/ai');
const ttsRoutes = require('./routes/tts');
const databaseRoutes = require('./routes/database');
const { createLogger } = require('./utils/logger');

dotenv.config();

const logger = createLogger('SERVER');

// 🔐 Get API key from environment variable
const getAPIKey = () => {
  return process.env.RABIN_VOICE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || null;
};

// Environment configuration
const ENV_CONFIG = {
  PORT: process.env.PORT || 3001,
  OPENROUTER_API_KEY: getAPIKey(),
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || process.env.RABIN_VOICE_OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
  TTS_API_URL: process.env.TTS_API_URL || process.env.RABIN_VOICE_TTS_API_URL || 'https://api.ahmadreza-avandi.ir/text-to-speech',
  LOG_LEVEL: process.env.LOG_LEVEL || process.env.RABIN_VOICE_LOG_LEVEL || 'INFO',
  NODE_ENV: process.env.NODE_ENV || 'production'
};

// Make ENV_CONFIG available globally
global.ENV_CONFIG = ENV_CONFIG;

// Setup file logging
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Debug environment variables
logger.info('🔧 Environment Variables', {
  PORT: ENV_CONFIG.PORT,
  OPENROUTER_API_KEY: ENV_CONFIG.OPENROUTER_API_KEY ? 'Set ✓' : 'Missing ✗',
  OPENROUTER_MODEL: ENV_CONFIG.OPENROUTER_MODEL,
  TTS_API_URL: ENV_CONFIG.TTS_API_URL,
  LOG_LEVEL: ENV_CONFIG.LOG_LEVEL,
  NODE_ENV: ENV_CONFIG.NODE_ENV
});

const app = express();
const PORT = ENV_CONFIG.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/database', databaseRoutes);

// Health check endpoints
app.get('/rabin-voice', (req, res) => {
  res.json({ status: 'OK', message: 'دستیار رابین آماده است' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'دستیار رابین آماده است' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'rabin-voice' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'دستیار صوتی رابین',
    version: '1.0.0',
    port: PORT
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Express error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🤖 دستیار رابین در پورت ${PORT} در حال اجرا است`);
  logger.info(`📡 Health check endpoints:`);
  logger.info(`   - GET http://0.0.0.0:${PORT}/rabin-voice`);
  logger.info(`   - GET http://0.0.0.0:${PORT}/health`);
  logger.info(`   - GET http://0.0.0.0:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM سیگنال دریافت شد. درحال خاموشی...');
  server.close(() => {
    logger.info('سرور بسته شد');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT سیگنال دریافت شد. درحال خاموشی...');
  server.close(() => {
    logger.info('سرور بسته شد');
    process.exit(0);
  });
});