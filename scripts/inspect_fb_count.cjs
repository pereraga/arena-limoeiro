const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const regex = /Fallback garantido para terça-feira 03\/11\/2026/g;
let m;
let count = 0;
while ((m = regex.exec(content)) !== null) {
  count++;
  console.log(`Occurrence #${count} at ${m.index}:`);
  console.log(content.substring(m.index, m.index + 500));
}
