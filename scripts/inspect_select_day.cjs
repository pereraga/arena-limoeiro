const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

function showFunc(name) {
  console.log(`\n=== FUNCTION: ${name} ===`);
  const idx = content.indexOf(name);
  if (idx !== -1) {
    console.log(content.substring(idx, idx + 1500));
  } else {
    console.log('Not found');
  }
}

showFunc('window.selectMovementDay');
