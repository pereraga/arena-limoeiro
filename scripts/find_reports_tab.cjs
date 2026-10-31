const fs = require('fs');

const content = fs.readFileSync('public/app.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes("setAdminTab('reports')") || l.includes("Relatórios & Backup") || l.includes("renderAdminBackupTab")) {
    console.log(idx + ': ' + l.trim());
  }
});
