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

console.log('🔍 Searching for syntax errors in all TypeScript/TSX files...\n');

const files = findFiles('app', /\.(ts|tsx)$/);
const errors = [];

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for malformed Bearer token pattern
      if (line.includes('Bearer ${token,')) {
        errors.push({
          file,
          line: index + 1,
          type: 'Malformed Bearer token',
          content: line.trim()
        });
      }
      
      // Check for single quote template literal
      if (line.match(/fetch\('\/api.*\$\{/)) {
        errors.push({
          file,
          line: index + 1,
          type: 'Single quote template literal',
          content: line.trim()
        });
      }
      
      // Check for double comma
      if (line.includes('application/json\',,')) {
        errors.push({
          file,
          line: index + 1,
          type: 'Double comma',
          content: line.trim()
        });
      }
    });
  } catch (error) {
    // Skip files that can't be read
  }
}

if (errors.length === 0) {
  console.log('✅ No syntax errors found!');
} else {
  console.log(`❌ Found ${errors.length} potential syntax errors:\n`);
  
  errors.forEach((error, i) => {
    console.log(`${i + 1}. ${error.type}`);
    console.log(`   File: ${error.file}`);
    console.log(`   Line: ${error.line}`);
    console.log(`   Code: ${error.content}`);
    console.log('');
  });
}
