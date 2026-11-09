const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- pullDataFromCloudDatabases (around 329632) ---');
console.log(content.substring(329600, 333000));
