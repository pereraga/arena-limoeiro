const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find tab-relatorios or relatorios in admin.html
const regex = /tab-relatorios|tab-reports|reportsSubtab|renderRelatorios|Relatórios/gi;
let m;
const hits = [];
while ((m = regex.exec(html)) !== null) {
  hits.push({ idx: m.index, match: m[0] });
}
console.log('Total hits:', hits.length);
hits.slice(0, 15).forEach(h => {
  console.log('--- At', h.idx, h.match);
  console.log(html.substring(Math.max(0, h.idx - 50), Math.min(html.length, h.idx + 150)));
});
