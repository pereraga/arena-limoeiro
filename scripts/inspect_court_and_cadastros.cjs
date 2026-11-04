const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

function showContext(target, len = 800) {
  console.log(`\n=== CONTEXT FOR: ${target} ===`);
  const idx = content.indexOf(target);
  if (idx !== -1) {
    console.log(content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + len)));
  } else {
    console.log('Not found');
  }
}

showContext('function loadCourtState');
showContext('function switchCadastrosSubTab');
showContext('btnSubtab-jogos');
