const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('window.renderCadastrosBookingsList();');
console.log(content.substring(idx - 100, idx + 250));
