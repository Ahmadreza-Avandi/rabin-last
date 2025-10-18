#!/usr/bin/env node

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function checkSuperAdmin() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD,
    });

    console.log('🔍 بررسی Super Admin...\n');

    const [admins] = await connection.query(
      'SELECT id, username, email, password, is_active FROM saas_master.super_admins'
    );

    if (admins.length === 0) {
      console.log('❌ هیچ Super Admin یافت نشد!');
    } else {
      console.log('✅ Super Admins:');
      admins.forEach(admin => {
        console.log(`\n   ID: ${admin.id}`);
        console.log(`   Username: ${admin.username}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Password Hash: ${admin.password ? admin.password.substring(0, 20) + '...' : 'NULL/UNDEFINED'}`);
        console.log(`   Active: ${admin.is_active ? 'Yes' : 'No'}`);
      });
    }

  } catch (error) {
    console.error('❌ خطا:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkSuperAdmin();
