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
  PORT: process.env.PORT,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? 'Set ✓' : 'Missing ✗',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
  TTS_API_URL: process.env.TTS_API_URL,
  LOG_LEVEL: process.env.LOG_LEVEL
});

const app = express();
const PORT = process.env.PORT || 3001;

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