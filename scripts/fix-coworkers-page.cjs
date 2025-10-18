const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', '[tenant_key]', 'dashboard', 'coworkers', 'page.tsx');

console.log('🔧 Fixing coworkers page syntax errors...');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  console.log('✓ File read successfully');
  
  let fixCount = 0;
  
  // Fix 1: Line 517 - template literal with single quotes
  const oldLine517 = "      const res = await fetch('/api/tenant/users?id=${encodeURIComponent(selectedUser.id)}', {";
  const newLine517 = "      const res = await fetch(`/api/tenant/users?id=${encodeURIComponent(selectedUser.id)}`, {";
  
  if (content.includes(oldLine517)) {
    content = content.replace(oldLine517, newLine517);
    console.log('✓ Fixed line 517: template literal');
    fixCount++;
  }
  
  // Fix 2: Check for similar issue in delete function (around line 547)
  const oldDelete = "      const res = await fetch('/api/tenant/users/${encodeURIComponent(user.id)}?hard=true', {";
  const newDelete = "      const res = await fetch(`/api/tenant/users/${encodeURIComponent(user.id)}?hard=true`, {";
  
  if (content.includes(oldDelete)) {
    content = content.replace(oldDelete, newDelete);
    console.log('✓ Fixed delete function: template literal');
    fixCount++;
  }
  
  if (fixCount > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`\n✅ Fixed ${fixCount} syntax error(s)!`);
  } else {
    console.log('\n⚠️  No issues found or already fixed');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
