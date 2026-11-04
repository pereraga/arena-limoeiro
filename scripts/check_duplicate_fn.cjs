const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Let's search if there's any other getMatchesForDate or any other definition
const matches = content.match(/function getMatchesForDate[\s\S]*?\n  \}/g);
console.log('Matches found for getMatchesForDate:', matches ? matches.length : 0);
if (matches) {
  matches.forEach((m, i) => console.log(`--- Match ${i} --- length ${m.length}\n` + m.slice(0, 300) + '...\n'));
}
