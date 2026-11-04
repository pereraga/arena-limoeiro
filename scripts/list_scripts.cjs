const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');

const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = regex.exec(content)) !== null) {
  count++;
  const src = match[0].match(/src="([^"]+)"/);
  console.log(`Script ${count}: src = ${src ? src[1] : 'INLINE (length ' + match[1].length + ')'}`);
}
