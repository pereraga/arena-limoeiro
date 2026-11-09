const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Search for renderMatchCardHtml definition
const idx = content.indexOf('function renderMatchCardHtml');
console.log('renderMatchCardHtml at:', idx);
if (idx !== -1) {
  console.log(content.substring(idx, idx + 2500));
}
