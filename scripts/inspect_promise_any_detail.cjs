const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking pullDataFromCloudDatabases Promise.any block ---');
const idx = content.indexOf('const bookingsPromise = Promise.any([');
console.log(content.substring(idx - 50, idx + 800));
