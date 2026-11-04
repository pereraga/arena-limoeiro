const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');

const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = regex.exec(content)) !== null) {
  count++;
  const src = match[0].match(/src="([^"]+)"/);
  if (!src) {
    console.log(`--- SCRIPT ${count} (first 200 chars) ---`);
    console.log(match[1].slice(0, 200));
  }
}
