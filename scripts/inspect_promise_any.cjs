const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- pullDataFromCloudDatabases Promise.any block ---');
const idx = content.indexOf('Promise.any([');
console.log(content.substring(idx - 100, idx + 1800));
