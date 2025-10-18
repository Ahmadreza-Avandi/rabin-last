const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app', '[tenant_key]', 'dashboard', 'customers', 'page.tsx');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  console.log(`Total lines: ${lines.length}\n`);
  
  // Search for useParams
  const useParamsLines = [];
  lines.forEach((line, index) => {
    if (line.includes('useParams')) {
      useParamsLines.push({ line: index + 1, content: line.trim() });
    }
  });
  
  if (useParamsLines.length > 0) {
    console.log('useParams found:');
    useParamsLines.forEach(f => console.log(`Line ${f.line}: ${f.content}`));
  } else {
    console.log('❌ useParams NOT found');
  }
  
  // Search for tenantKey
  const tenantKeyLines = [];
  lines.forEach((line, index) => {
    if (line.includes('tenantKey') || line.includes('tenant_key')) {
      tenantKeyLines.push({ line: index + 1, content: line.trim() });
    }
  });
  
  console.log(`\ntenantKey/tenant_key found: ${tenantKeyLines.length} times`);
  if (tenantKeyLines.length > 0 && tenantKeyLines.length < 20) {
    tenantKeyLines.forEach(f => console.log(`Line ${f.line}: ${f.content}`));
  }
  
  // Search for fetch calls
  const fetchLines = [];
  lines.forEach((line, index) => {
    if (line.includes('fetch(')) {
      fetchLines.push({ line: index + 1, content: line.trim() });
    }
  });
  
  console.log(`\nfetch calls found: ${fetchLines.length}`);
  if (fetchLines.length > 0 && fetchLines.length < 10) {
    fetchLines.forEach(f => console.log(`Line ${f.line}: ${f.content}`));
  }
  
} catch (error) {
  console.error('Error:', error.message);
}
