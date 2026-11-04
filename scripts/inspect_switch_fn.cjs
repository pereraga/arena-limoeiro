const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const targetIdx = 371473;
console.log(content.substring(targetIdx, targetIdx + 2000));
