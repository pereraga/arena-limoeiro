const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('Has \\r\\n:', content.includes('\r\n'));
console.log('Has \\n:', content.includes('\n'));
