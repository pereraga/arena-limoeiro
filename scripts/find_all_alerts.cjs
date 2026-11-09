const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Search for other alert() calls in admin.html
const regex = /alert\s*\(/g;
let match;
const matches = [];
while ((match = regex.exec(content)) !== null) {
  matches.push({
    index: match.index,
    snippet: content.substring(Math.max(0, match.index - 50), Math.min(content.length, match.index + 150))
  });
}

console.log(`Total alert() calls in admin.html: ${matches.length}`);
matches.forEach((m, idx) => {
  console.log(`\n--- Alert ${idx + 1} at ${m.index} ---`);
  console.log(m.snippet);
});
