const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find all court dropdowns that can be updated dynamically
const courtSelects = [
  'modalGerenciarQuadra',
  'courtsBookingCourtFilter',
  'subtabBookingCourtFilter',
  'directBookingCourt',
  'editMatchCourt',
  'contractCourt'
];

console.log('Checking court selects:');
courtSelects.forEach(id => {
  const re = new RegExp('<select[^>]*id=["\']' + id + '["\'][^>]*>', 'i');
  console.log(id, 'exists:', re.test(html));
});
