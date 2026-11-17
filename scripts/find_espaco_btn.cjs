const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find ESPEC: or Todas as Quadras e Campos or movementCourtFilter
const idx = html.indexOf('ESPAÇO:');
console.log('Index of ESPAÇO::', idx);
if (idx !== -1) {
  console.log(html.substring(Math.max(0, idx - 200), Math.min(html.length, idx + 400)));
} else {
  const idx2 = html.indexOf('Todas as Quadras e Campos');
  console.log('Index of Todas as Quadras e Campos:', idx2);
  if (idx2 !== -1) {
    console.log(html.substring(Math.max(0, idx2 - 200), Math.min(html.length, idx2 + 400)));
  }
}
