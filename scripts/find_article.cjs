const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('<article') || l.includes('id="card-') || l.includes("id='card-")) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
