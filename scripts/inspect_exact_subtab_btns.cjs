const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('<!-- Horários Fixos (40) -->');
console.log('Horarios Fixos pos:', idx);
if (idx !== -1) {
  console.log(content.substring(idx - 50, idx + 600));
}
