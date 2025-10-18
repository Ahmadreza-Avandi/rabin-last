#!/usr/bin/env node

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function fixSuperAdminPassword() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD,
    });

    console.log('🔐 تولید password hash...');
    const password = 'Ahmadreza.avandi';
    const passwordHash = await bcrypt.hash(password, 10);
    console.log(`✅ Hash: ${passwordHash.substring(0, 30)}...\n`);

    console.log('💾 به‌روزرسانی Super Admin...');
    await connection.query(
      `UPDATE saas_master.super_admins 
       SET password_hash = ? 
       WHERE username = 'Ahmadreza.avandi'`,
      [passwordHash]
    );

    console.log('✅ Password به‌روزرسانی شد!\n');
    console.log('📝 اطلاعات لاگین:');
    console.log('   Username: Ahmadreza.avandi');
    console.log('   Password: Ahmadreza.avandi');
    console.log('   URL: http://localhost:3000/secret-zone-789/login\n');

  } catch (error) {
    console.error('❌ خطا:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixSuperAdminPassword();
