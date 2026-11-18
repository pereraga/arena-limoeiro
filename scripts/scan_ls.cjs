const fs = require('fs');
const path = require('path');
const adminPath = path.resolve(__dirname, '../public/admin.html');
const content = fs.readFileSync(adminPath, 'utf8');
const lsMatches = content.match(/localStorage\.(setItem|getItem|removeItem)\([^)]+\)/g);
console.log('Total localStorage calls:', lsMatches ? lsMatches.length : 0);
const unique = [...new Set(lsMatches)];
console.log('Unique localStorage calls:');
unique.forEach(u => console.log(' -', u.slice(0, 100)));
