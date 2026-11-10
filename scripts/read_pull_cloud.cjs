const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== pullDataFromCloudDatabases (around line 6140-6235) ===');
console.log(lines.slice(6130, 6225).join('\n'));
