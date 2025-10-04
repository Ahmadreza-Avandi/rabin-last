/**
 * سیستم لاگ‌گیری برای دیباگ و مانیتورینگ
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LOG_COLORS = {
  ERROR: '\x1b[31m', // قرمز
  WARN: '\x1b[33m',  // زرد
  INFO: '\x1b[36m',  // آبی
  DEBUG: '\x1b[37m', // سفید
  RESET: '\x1b[0m'
};

class Logger {
  constructor(module = 'SYSTEM') {
    this.module = module;
    this.logLevel = process.env.LOG_LEVEL || 'INFO';
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const color = LOG_COLORS[level];
    const reset = LOG_COLORS.RESET;
    
    let logMessage = `${color}[${timestamp}] [${level}] [${this.module}] ${message}${reset}`;
    
    if (data) {
      logMessage += `\n${color}Data: ${JSON.stringify(data, null, 2)}${reset}`;
    }
    
    return logMessage;
  }

  shouldLog(level) {
    const currentLevel = LOG_LEVELS[this.logLevel] || LOG_LEVELS.INFO;
    const messageLevel = LOG_LEVELS[level];
    return messageLevel <= currentLevel;
  }

  error(message, data = null) {
    if (this.shouldLog('ERROR')) {
      console.error(this.formatMessage('ERROR', message, data));
    }
  }

  warn(message, data = null) {
    if (this.shouldLog('WARN')) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  info(message, data = null) {
    if (this.shouldLog('INFO')) {
      console.log(this.formatMessage('INFO', message, data));
    }
  }

  debug(message, data = null) {
    if (this.shouldLog('DEBUG')) {
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }

  // متدهای خاص برای دیتابیس
  dbQuery(query, params = []) {
    this.debug('🔍 Database Query', { query, params });
  }

  dbResult(rowCount, executionTime = null) {
    this.info(`✅ Query executed successfully, rows: ${rowCount}`, 
      executionTime ? { executionTime: `${executionTime}ms` } : null);
  }

  dbError(error, query = null) {
    this.error('❌ Database Error', { 
      error: error.message, 
      query: query || 'Unknown query',
      stack: error.stack 
    });
  }

  // متدهای خاص برای تشخیص کلمات کلیدی
  keywordDetected(keyword, action) {
    this.info(`🎯 Keyword detected: "${keyword}" -> ${action}`);
  }

  keywordProcessing(text, keywordsFound) {
    this.debug('🔍 Processing text for keywords', { 
      text: text.substring(0, 100) + '...', 
      keywordsFound 
    });
  }

  // متدهای خاص برای AI
  aiRequest(userMessage, hasSystemData) {
    this.info('🤖 AI Request', { 
      messageLength: userMessage.length,
      hasSystemData,
      preview: userMessage.substring(0, 50) + '...'
    });
  }

  aiResponse(responseLength, intent = null) {
    this.info('🤖 AI Response generated', { 
      responseLength,
      intent 
    });
  }

  // متدهای خاص برای TTS
  ttsRequest(textLength) {
    this.info('🔊 TTS Request', { textLength });
  }

  ttsSuccess(audioUrl) {
    this.info('🔊 TTS Success', { audioUrl: audioUrl ? 'Generated' : 'Failed' });
  }

  ttsError(error) {
    this.error('🔊 TTS Error', { error: error.message });
  }
}

// Factory function برای ایجاد logger برای ماژول‌های مختلف
function createLogger(module) {
  return new Logger(module);
}

module.exports = {
  Logger,
  createLogger,
  LOG_LEVELS
};