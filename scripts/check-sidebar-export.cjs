const fs = require('fs');

const content = fs.readFileSync('components/layout/dashboard-sidebar.tsx', 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);
console.log('\nLast 30 lines:');
lines.slice(-30).forEach((line, i) => {
  const lineNum = lines.length - 30 + i + 1;
  console.log(`${lineNum}: ${line}`);
});

// Search for export
console.log('\n\nSearching for exports:');
lines.forEach((line, i) => {
  if (line.includes('export')) {
    console.log(`Line ${i + 1}: ${line}`);
  }
});
