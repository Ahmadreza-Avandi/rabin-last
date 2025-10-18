const fs = require('fs');
const path = require('path');

function findFiles(dir, pattern, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next')) {
        findFiles(filePath, pattern, results);
      }
    } else if (file.match(pattern)) {
      results.push(filePath);
    }
  }
  
  return results;
}

console.log('🔧 Auto-fixing all syntax errors...\n');

const files = findFiles('app', /\.(ts|tsx)$/);
let totalFixes = 0;

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    let fixes = 0;
    
    // Fix 1: Malformed Bearer token pattern
    // From: 'Authorization': token ? `Bearer ${token,
    //       'X-Tenant-Key': params?.tenant_key || tenantKey}` : '',
    // To:   'Authorization': token ? `Bearer ${token}` : '',
    //       'X-Tenant-Key': params?.tenant_key || tenantKey,
    const bearerPattern = /headers:\s*\{['"]Authorization['"]:.*?`Bearer \$\{token,\s*['"]X-Tenant-Key['"]:.*?\}` : '',/gs;
    if (bearerPattern.test(content)) {
      content = content.replace(bearerPattern, (match) => {
        fixes++;
        // Extract the X-Tenant-Key value
        const tenantKeyMatch = match.match(/['"]X-Tenant-Key['"]:([^}]+)\}/);
        const tenantKeyValue = tenantKeyMatch ? tenantKeyMatch[1].trim() : "params?.tenant_key || tenantKey";
        
        return `headers: {
          'Authorization': token ? \`Bearer \${token}\` : '',
          'X-Tenant-Key': ${tenantKeyValue},`;
      });
      modified = true;
    }
    
    // Fix 2: Single quote template literals in fetch
    // From: fetch('/api/...${var}...')
    // To:   fetch(`/api/...${var}...`)
    const singleQuotePattern = /fetch\('(\/api[^']*\$\{[^']*)'[,\)]/g;
    if (singleQuotePattern.test(content)) {
      content = content.replace(singleQuotePattern, (match, url) => {
        fixes++;
        return match.replace(`'${url}'`, `\`${url}\``);
      });
      modified = true;
    }
    
    // Fix 3: Double comma in headers
    // From: 'application/json',,
    // To:   'application/json',
    const doubleCommaPattern = /'application\/json',\s*,/g;
    if (doubleCommaPattern.test(content)) {
      content = content.replace(doubleCommaPattern, "'application/json',");
      fixes++;
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Fixed ${fixes} error(s) in: ${file}`);
      totalFixes += fixes;
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
}

console.log(`\n✅ Total fixes applied: ${totalFixes}`);
console.log('\n⚠️  Note: Some complex patterns may need manual review.');
console.log('Run "npm run build" to check for remaining errors.');
