const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app', '[tenant_key]', 'dashboard', 'coworkers', 'page.tsx');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  console.log(`Total lines: ${lines.length}`);
  
  // Search for fetch calls
  const fetchLines = [];
  lines.forEach((line, index) => {
    if (line.includes('fetch(') || line.includes('fetch ')) {
      fetchLines.push({ line: index + 1, content: line.trim() });
    }
  });
  
  if (fetchLines.length > 0) {
    console.log('\nFetch calls found:');
    fetchLines.forEach(f => {
      console.log(`Line ${f.line}: ${f.content}`);
    });
  } else {
    console.log('\nNo fetch calls found');
  }
  
  // Search for useEffect
  const useEffectLines = [];
  lines.forEach((line, index) => {
    if (line.includes('useEffect')) {
      useEffectLines.push({ line: index + 1, content: line.trim() });
    }
  });
  
  if (useEffectLines.length > 0) {
    console.log('\nuseEffect calls found:');
    useEffectLines.forEach(f => {
      console.log(`Line ${f.line}: ${f.content}`);
    });
  } else {
    console.log('\nNo useEffect calls found');
  }
  
  // Search for X-Tenant-Key
  const tenantKeyLines = [];
  lines.forEach((line, index) => {
    if (line.includes('X-Tenant-Key') || line.includes('tenant_key')) {
      tenantKeyLines.push({ line: index + 1, content: line.trim() });
    }
  });
  
  if (tenantKeyLines.length > 0) {
    console.log('\nX-Tenant-Key or tenant_key found:');
    tenantKeyLines.forEach(f => {
      console.log(`Line ${f.line}: ${f.content}`);
    });
  } else {
    console.log('\nNo X-Tenant-Key or tenant_key found');
  }
  
} catch (error) {
  console.error('Error:', error.message);
}
