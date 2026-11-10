const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

lines.forEach((l, i) => {
  if (l.includes('<form') || l.includes('class="modal') || (l.includes('id="modal') && !l.includes('modalGerenciar') && !l.includes('arenaEditModal'))) {
    console.log(`Line ${i+1}: ${l.trim().slice(0, 120)}`);
  }
});
