const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const files = [
  'public/adm-sec-x9k7-limoeiro-2026-auth.html',
  'public/adm-sec-x9k7-limoeiro-2026.html',
  'public/index-sistema1.html',
  'public/sistema1.html'
];

files.forEach(f => {
  const p = path.join(__dirname, '..', f);
  fs.writeFileSync(p, content, 'utf8');
  console.log('Synced:', f);
});
console.log('All mirrors successfully synchronized!');
