const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const targets = ['arenaToast', 'mostrarToast', 'showNotification', 'toast'];
targets.forEach(t => {
  const count = [...content.matchAll(new RegExp(t, 'g'))].length;
  console.log(`${t}: count=${count}`);
  const idx = content.indexOf('function ' + t);
  if (idx !== -1) {
    console.log(`--- function ${t} ---`);
    console.log(content.substring(idx, idx + 600));
  }
});
