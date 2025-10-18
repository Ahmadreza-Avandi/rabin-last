const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join(__dirname, '..', 'app', '[tenant_key]', 'dashboard', 'coworkers', 'page.tsx');

console.log('🔧 Fixing template literal syntax error...');
console.log('📁 File:', filePath);

try {
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  console.log('✓ File read successfully');
  
  // Fix the template literal - replace single quotes with backticks
  // The actual pattern in the file (without quotes around it)
  const pattern1 = "'/api/tenant/users?id=${encodeURIComponent(selectedUser.id)}'";
  const pattern2 = "'/api/tenant/users?id=$";
  
  let fixed = false;
  
  // Try exact match first
  if (content.includes(pattern1)) {
    content = content.replace(pattern1, "`/api/tenant/users?id=${encodeURIComponent(selectedUser.id)}`");
    fixed = true;
  }
  // Try line by line replacement
  else {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('/api/tenant/users?id=') && 
          lines[i].includes('encodeURIComponent') &&
          lines[i].includes("'")) {
        console.log(`Fixing line ${i + 1}...`);
        // Replace single quotes with backticks for template literal
        lines[i] = lines[i].replace(
          /fetch\('\/api\/tenant\/users\?id=\$\{encodeURIComponent\(selectedUser\.id\)\}'/,
          "fetch(`/api/tenant/users?id=${encodeURIComponent(selectedUser.id)}`"
        );
        fixed = true;
        break;
      }
    }
    if (fixed) {
      content = lines.join('\n');
    }
  }
  
  if (fixed) {
    // Write back to file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✓ File saved successfully');
    console.log('\n✅ Template literal fixed!');
  } else {
    console.log('⚠️  Could not fix automatically. Manual fix needed.');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
