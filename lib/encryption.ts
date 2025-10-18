/**
 * Encryption/Decryption Utilities
 * 
 * این ماژول برای encrypt و decrypt کردن password های دیتابیس tenant استفاده می‌شود
 * از الگوریتم AES-256-GCM استفاده می‌کند
 */

import crypto from 'crypto';

// الگوریتم encryption
const ALGORITHM = 'aes-256-gcm';

// دریافت encryption key از environment variable
function getEncryptionKey(): Buffer {
  const key = process.env.DB_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('DB_ENCRYPTION_KEY environment variable is not set');
  }
  
  // اگر key به‌صورت hex است، تبدیل به Buffer
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  
  // اگر key کوتاه‌تر است، hash می‌کنیم تا 32 byte شود
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt کردن password
 * 
 * @param password - Password برای encrypt
 * @returns Encrypted string به فرمت: iv:authTag:encrypted
 */
export function encryptPassword(password: string): string {
  try {
    const key = getEncryptionKey();
    
    // تولید IV تصادفی (16 bytes)
    const iv = crypto.randomBytes(16);
    
    // ایجاد cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt کردن
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // دریافت authentication tag
    const authTag = cipher.getAuthTag();
    
    // برگرداندن به فرمت: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Error encrypting password:', error);
    throw new Error('Failed to encrypt password');
  }
}

/**
 * Decrypt کردن password
 * 
 * @param encryptedData - Encrypted string به فرمت: iv:authTag:encrypted
 * @returns Decrypted password
 */
export function decryptPassword(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    
    // جدا کردن اجزای encrypted data
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    
    // تبدیل hex به Buffer
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // ایجاد decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt کردن
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting password:', error);
    throw new Error('Failed to decrypt password');
  }
}

/**
 * تولید encryption key تصادفی
 * این تابع برای تولید key اولیه استفاده می‌شود
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * تست encryption/decryption
 */
export function testEncryption(): boolean {
  try {
    const testPassword = 'test_password_123';
    const encrypted = encryptPassword(testPassword);
    const decrypted = decryptPassword(encrypted);
    
    if (testPassword === decrypted) {
      console.log('✅ Encryption test passed');
      return true;
    } else {
      console.error('❌ Encryption test failed: passwords do not match');
      return false;
    }
  } catch (error) {
    console.error('❌ Encryption test failed:', error);
    return false;
  }
}

/**
 * Hash کردن password با bcrypt (برای super admin passwords)
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, 10);
}

/**
 * مقایسه password با hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcrypt');
  return bcrypt.compare(password, hash);
}
