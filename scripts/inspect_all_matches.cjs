const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const idx = content.indexOf('const allMatches = getMatchesForDate(dateStr);');
console.log('Snippet around allMatches:\n', content.substring(idx - 200, idx + 1000));
