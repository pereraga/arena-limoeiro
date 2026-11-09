const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const sIdx = content.indexOf('window.handleSaveDirectBooking =');
const eIdx = content.indexOf('window.toggleMatchStatus =');
console.log(content.substring(sIdx + 1500, eIdx));
