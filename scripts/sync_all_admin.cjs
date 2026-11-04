const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const src = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(src);
const srcHash = crypto.createHash('sha256').update(content).digest('hex');

const targets = [
  path.join(__dirname, '..', 'public', 'index-sistema1.html'),
  path.join(__dirname, '..', 'public', 'adm-sec-x9k7-limoeiro-2026-auth.html'),
  path.join(__dirname, '..', 'public', 'adm-sec-x9k7-limoeiro-2026.html'),
  path.join(__dirname, '..', 'public', 'sistema1.html'),
  'C:/Users/PC/Downloads/painel-adm-arenalimoeiro-completo.html'
];

console.log('Source SHA256:', srcHash);
targets.forEach(t => {
  try {
    fs.writeFileSync(t, content);
    const h = crypto.createHash('sha256').update(fs.readFileSync(t)).digest('hex');
    console.log(`Synced: ${path.basename(t)} -> SHA256: ${h} (matches: ${h === srcHash})`);
  } catch(e) {
    console.error(`Failed to sync ${t}:`, e.message);
  }
});
