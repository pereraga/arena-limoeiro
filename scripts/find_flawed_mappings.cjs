const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf-8');
const lines = content.split('\n');

const fixes = [];
lines.forEach((l, idx) => {
  if (l.includes("courtId === 'fut7'") && l.includes("court-futsal-1788963178368")) {
    fixes.push(idx + 1);
  }
});
console.log('Lines with legacy flawed mapping:', fixes);
