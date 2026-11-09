const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const sIdx = content.indexOf('window.handleSaveDirectBooking =');
console.log(content.substring(sIdx + 1800, sIdx + 3800));
