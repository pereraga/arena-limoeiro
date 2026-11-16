const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find occurrences of modalEditarEspaco or how a court is edited
const regex = /modalEditarEspaco|salvarEdicaoEspaco|openEditCourtModal|editCourt|salvarQuadra/gi;
let m;
while ((m = regex.exec(html)) !== null) {
  console.log('--- At index:', m.index, m[0]);
  console.log(html.substring(Math.max(0, m.index - 50), Math.min(html.length, m.index + 300)));
}
