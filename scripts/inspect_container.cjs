const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const targetContainer = content.substring(70000, 71500);
console.log('Container snippet:\n', targetContainer);
