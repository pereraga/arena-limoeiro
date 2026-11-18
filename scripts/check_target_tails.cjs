const fs = require('fs');
const path = require('path');
const adminPath = path.resolve(__dirname, '../public/admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

function showFnTail(name) {
  const idx = content.indexOf(name);
  if (idx !== -1) {
    console.log('=== ' + name + ' (TAIL) ===');
    console.log(content.substring(idx + 800, idx + 2400));
  }
}

showFnTail('window.saveEditGame =');
showFnTail('window.saveContract =');
showFnTail('window.saveFinishGame =');
