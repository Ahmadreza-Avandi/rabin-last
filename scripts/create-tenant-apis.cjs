const fs = require('fs');
const path = require('path');

// Template برای tenant API
const apiTemplate = (resourceName, tableName) => `import { NextRequest, NextResponse } from 'next/server';
import { getTenantSessionFromRequest } from '@/lib/tenant-auth';

const mysql = require('mysql2/promise');

export async function GET(request: NextRequest) {
  let connection;
  
  try {
    const tenantKey = request.headers.get('X-Tenant-Key');

    if (!tenantKey) {
      return NextResponse.json(
        { success: false, message: 'Tenant key یافت نشد' },
        { status: 400 }
      );
    }

    const session = getTenantSessionFromRequest(request, tenantKey);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز' },
        { status: 401 }
      );
    }

    // اتصال مستقیم به crm_system
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'crm_user',
      password: process.env.DB_PASSWORD || '1234',
      database: 'crm_system',
      waitForConnections: true,
      connectionLimit: 10
    });

    const [rows] = await pool.query('SELECT * FROM ${tableName}');

    return NextResponse.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('❌ خطا در دریافت ${resourceName}:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور' },
      { status: 500 }
    );
  }
}
`;

// API های مورد نیاز
const apisToCreate = [
  { name: 'users', path: 'app/api/tenant/users/route.ts', table: 'users' },
  { name: 'activities', path: 'app/api/tenant/activities/route.ts', table: 'activities' },
  { name: 'contacts', path: 'app/api/tenant/contacts/route.ts', table: 'contacts' },
  { name: 'deals', path: 'app/api/tenant/deals/route.ts', table: 'deals' },
  { name: 'tasks', path: 'app/api/tenant/tasks/route.ts', table: 'tasks' },
  { name: 'products', path: 'app/api/tenant/products/route.ts', table: 'products' },
  { name: 'feedback', path: 'app/api/tenant/feedback/route.ts', table: 'feedback' },
];

console.log('🚀 ایجاد API های tenant...\n');

let created = 0;
let skipped = 0;

apisToCreate.forEach(api => {
  const dir = path.dirname(api.path);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(api.path)) {
    console.log(`⏭️  ${api.name}: قبلاً وجود دارد`);
    skipped++;
    return;
  }

  const content = apiTemplate(api.name, api.table);
  fs.writeFileSync(api.path, content, 'utf8');
  console.log(`✅ ${api.name}: ایجاد شد`);
  created++;
});

console.log('\n' + '='.repeat(50));
console.log(`✅ ایجاد شده: ${created}`);
console.log(`⏭️  رد شده: ${skipped}`);
console.log('='.repeat(50));
