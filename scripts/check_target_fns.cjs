const fs = require('fs');
const path = require('path');
const adminPath = path.resolve(__dirname, '../public/admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

function showFn(name) {
  const idx = content.indexOf(name);
  if (idx !== -1) {
    console.log('=== ' + name + ' ===');
    console.log(content.substring(idx, idx + 1200));
  } else {
    console.log('=== ' + name + ' NOT FOUND ===');
  }
}

showFn('window.saveEditGame =');
showFn('window.saveContract =');
showFn('window.saveFinishGame =');
