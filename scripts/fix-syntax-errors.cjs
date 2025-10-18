const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing syntax errors in multiple files...\n');

// Fix 1: Coworkers page - line 517
const coworkersPath = path.join(__dirname, '..', 'app', '[tenant_key]', 'dashboard', 'coworkers', 'page.tsx');
try {
  let content = fs.readFileSync(coworkersPath, 'utf8');
  
  // Replace mixed quotes with proper backticks
  const oldPattern = "fetch('/api/tenant/users?id=${encodeURIComponent(selectedUser.id)}`";
  const newPattern = "fetch(`/api/tenant/users?id=${encodeURIComponent(selectedUser.id)}`";
  
  if (content.includes(oldPattern)) {
    content = content.replace(oldPattern, newPattern);
    fs.writeFileSync(coworkersPath, content, 'utf8');
    console.log('✅ Fixed coworkers page (line 517)');
  } else {
    console.log('⚠️  Coworkers: Pattern not found or already fixed');
  }
} catch (error) {
  console.error('❌ Coworkers error:', error.message);
}

// Fix 2: Calendar page - line 101-102
const calendarPath = path.join(__dirname, '..', 'app', '[tenant_key]', 'dashboard', 'calendar', 'page.tsx');
try {
  let content = fs.readFileSync(calendarPath, 'utf8');
  
  // Fix the broken headers object
  const oldHeaders = `headers: {'Authorization': token ? \`Bearer \${token,
        'X-Tenant-Key': params?.tenant_key || tenantKey}\` : '',`;
  
  const newHeaders = `headers: {
          'Authorization': token ? \`Bearer \${token}\` : '',
          'X-Tenant-Key': params?.tenant_key || tenantKey,`;
  
  if (content.includes(oldHeaders)) {
    content = content.replace(oldHeaders, newHeaders);
    fs.writeFileSync(calendarPath, content, 'utf8');
    console.log('✅ Fixed calendar page (line 101-102)');
  } else {
    // Try alternative pattern
    const lines = content.split('\n');
    let fixed = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("'Authorization': token ? `Bearer ${token,")) {
        console.log(`Found issue at line ${i + 1}, fixing...`);
        // Fix this line and the next
        lines[i] = "        headers: {";
        lines[i + 1] = "          'Authorization': token ? `Bearer ${token}` : '',";
        lines[i + 2] = "          'X-Tenant-Key': params?.tenant_key || tenantKey,";
        fixed = true;
        break;
      }
    }
    
    if (fixed) {
      content = lines.join('\n');
      fs.writeFileSync(calendarPath, content, 'utf8');
      console.log('✅ Fixed calendar page (alternative method)');
    } else {
      console.log('⚠️  Calendar: Pattern not found or already fixed');
    }
  }
} catch (error) {
  console.error('❌ Calendar error:', error.message);
}

// Fix 3: Calendar page - line 100 (template literal)
try {
  let content = fs.readFileSync(calendarPath, 'utf8');
  
  const oldFetch = "fetch('/api/tenant/events?${params.toString()}'";
  const newFetch = "fetch(`/api/tenant/events?${params.toString()}`";
  
  if (content.includes(oldFetch)) {
    content = content.replace(oldFetch, newFetch);
    fs.writeFileSync(calendarPath, content, 'utf8');
    console.log('✅ Fixed calendar page fetch URL (line 100)');
  }
} catch (error) {
  console.error('❌ Calendar fetch error:', error.message);
}

console.log('\n✅ All fixes applied!');
