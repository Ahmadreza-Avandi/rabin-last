const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const aiRoutes = require('./routes/ai');
const ttsRoutes = require('./routes/tts');
const databaseRoutes = require('./routes/database');
const { createLogger } = require('./utils/logger');

dotenv.config();

const logger = createLogger('SERVER');

// Debug environment variables
logger.info('🔧 Environment Variables', {
  PORT: ENV_CONFIG.PORT,
  OPENROUTER_API_KEY: ENV_CONFIG.OPENROUTER_API_KEY ? 'Set ✓' : 'Missing ✗',
  OPENROUTER_MODEL: ENV_CONFIG.OPENROUTER_MODEL,
  TTS_API_URL: ENV_CONFIG.TTS_API_URL,
  LOG_LEVEL: ENV_CONFIG.LOG_LEVEL
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