#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🔧 Fixing Tenant Isolation Issues...\n');
console.log('='.repeat(80));

// Files that need tenant_key filtering
const filesToFix = [
  {
    path: 'app/api/tenant/users/route.ts',
    description: 'Tenant Users API',
    fixes: [
      {
        search: /WHERE\s+status\s*=\s*'active'/g,
        replace: "WHERE status = 'active' AND tenant_key = ?"
      },
      {
        search: /WHERE\s+u\.status\s*=\s*'active'/g,
        replace: "WHERE u.status = 'active' AND u.tenant_key = ?"
      }
    ]
  },
  {
    path: 'app/api/coworkers/route.ts',
    description: 'Coworkers API',
    note: 'Already fixed!'
  }
];

console.log('📋 Files to check:\n');

filesToFix.forEach((file, index) => {
  console.log(`${index + 1}. ${file.description}`);
  console.log(`   Path: ${file.path}`);
  
  const fullPath = path.join(process.cwd(), file.path);
  
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ File exists`);
    
    if (file.note) {
      console.log(`   📝 ${file.note}`);
    }
  } else {
    console.log(`   ⚠️  File not found`);
  }
  console.log('');
});

console.log('='.repeat(80));
console.log('\n🎯 Summary of Required Changes:\n');

console.log('1. ✅ app/api/coworkers/route.ts');
console.log('   - Already added tenant_key filter\n');

console.log('2. 📝 app/api/tenant/users/route.ts');
console.log('   - Need to add tenant_key filter to GET endpoint');
console.log('   - Need to ensure POST adds tenant_key to new users\n');

console.log('3. 📝 app/api/customers/route.ts');
console.log('   - Need to add tenant_key column to customers table');
console.log('   - Need to filter by tenant_key\n');

console.log('4. 📝 All other data APIs');
console.log('   - activities, tasks, deals, etc.');
console.log('   - All need tenant_key filtering\n');

console.log('='.repeat(80));
console.log('\n💡 Next Steps:\n');
console.log('1. Run: node scripts/add-tenant-key-to-tables.cjs');
console.log('   - Adds tenant_key column to all tables\n');

console.log('2. Run: node scripts/update-all-apis-for-tenant.cjs');
console.log('   - Updates all APIs to filter by tenant_key\n');

console.log('3. Test isolation:');
console.log('   - Login as rabin user');
console.log('   - Should only see rabin data');
console.log('   - Login as samin user');
console.log('   - Should only see samin data\n');

