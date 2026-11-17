const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find slot button rendering when Livre
const idx = html.indexOf("btn.className = 'p-2 rounded-xl text-[11px] font-bold bg-emerald-50/70");
console.log('Found slot Livre styling at:', idx);
if (idx !== -1) {
  console.log(html.substring(idx - 50, idx + 800));
}
