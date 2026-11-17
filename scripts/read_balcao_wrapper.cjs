const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find balcaoScheduledGamesContainer and its wrapper
const idx = html.indexOf('<div class="space-y-3 p-3.5 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-emerald-200/80 rounded-2xl shadow-xs">');
console.log('Window wrapper at:', idx);
if (idx !== -1) {
  console.log(html.substring(idx, idx + 2500));
}
