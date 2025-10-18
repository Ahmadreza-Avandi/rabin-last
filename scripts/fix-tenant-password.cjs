const mysql = require('mysql2/promise');
const crypto = require('crypto');

// تابع encrypt password
function encryptPassword(password) {
  const ALGORITHM = 'aes-256-gcm';
  const key = Buffer.from('0329f3e3b5cd43ee84e81b2799f778c6d3b7d774f1a54950b9f7efc9ab2708ac', 'hex');
  
  // تولید IV تصادفی
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
}

async function fixTenantPassword() {
  let connection;
  
  try {
    // اتصال به saas_master
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'saas_master'
    });
    
    console.log('✅ Connected to saas_master database\n');
    
    // پسورد خالی برای root
    const password = '';
    const encryptedPassword = encryptPassword(password);
    
    console.log('🔐 Encrypting password...');
    console.log('Original password:', password === '' ? '(empty)' : password);
    console.log('Encrypted:', encryptedPassword);
    console.log('Length:', encryptedPassword.length);
    
    // آپدیت tenant rabin
    await connection.query(
      'UPDATE tenants SET db_password = ? WHERE tenant_key = ?',
      [encryptedPassword, 'rabin']
    );
    
    console.log('\n✅ Updated tenant rabin password');
    
    // تست decrypt
    console.log('\n🧪 Testing decryption...');
    const ALGORITHM = 'aes-256-gcm';
    const key = Buffer.from('0329f3e3b5cd43ee84e81b2799f778c6d3b7d774f1a54950b9f7efc9ab2708ac', 'hex');
    
    const parts = encryptedPassword.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    console.log('Decrypted password:', decrypted === '' ? '(empty)' : decrypted);
    console.log('✅ Encryption/Decryption test passed!');
    
    // نمایش اطلاعات نهایی
    const [tenants] = await connection.query(
      'SELECT * FROM tenants WHERE tenant_key = ?',
      ['rabin']
    );
    
    console.log('\n📊 Updated tenant info:');
    console.log('Tenant Key:', tenants[0].tenant_key);
    console.log('DB Name:', tenants[0].db_name);
    console.log('DB User:', tenants[0].db_user);
    console.log('DB Password (encrypted):', tenants[0].db_password);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixTenantPassword();
