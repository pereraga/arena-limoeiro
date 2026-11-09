const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking pullDataFromCloudDatabases beginning ---');
const idx = content.indexOf('window.pullDataFromCloudDatabases =');
console.log(content.substring(idx, idx + 800));
