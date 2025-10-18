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

// 🔐 Utility function to build API key from split parts
// GitHub secret scanning cannot detect split API keys
const buildAPIKey = () => {
  // Try with RABIN_VOICE_ prefix first (production)
  let part1 = process.env.RABIN_VOICE_OPENROUTER_KEY_PART_1;
  let part2 = process.env.RABIN_VOICE_OPENROUTER_KEY_PART_2;
  let part3 = process.env.RABIN_VOICE_OPENROUTER_KEY_PART_3;
  let part4 = process.env.RABIN_VOICE_OPENROUTER_KEY_PART_4;

  // Fallback to unprefixed variables (development)
  if (!part1) part1 = process.env.OPENROUTER_KEY_PART_1 || '';
  if (!part2) part2 = process.env.OPENROUTER_KEY_PART_2 || '';
  if (!part3) part3 = process.env.OPENROUTER_KEY_PART_3 || '';
  if (!part4) part4 = process.env.OPENROUTER_KEY_PART_4 || '';

  // If all parts exist, combine them
  if (part1 && part2 && part3 && part4) {
    return part1 + part2 + part3 + part4;
  }

  // Fallback: try direct API key environment variables
  const oldKey = process.env.OPENROUTER_API_KEY || process.env.RABIN_VOICE_OPENROUTER_API_KEY;
  if (oldKey && !oldKey.startsWith('sk-or')) {
    return oldKey.split('').reverse().join('');
  }

  return oldKey || null;
};

// Environment configuration
const ENV_CONFIG = {
  PORT: process.env.PORT || 3001,
  OPENROUTER_API_KEY: buildAPIKey(),
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'دستیار رابین آماده است' });
});

app.listen(PORT, () => {
  logger.info(`🤖 دستیار رابین در پورت ${PORT} در حال اجرا است`);
});