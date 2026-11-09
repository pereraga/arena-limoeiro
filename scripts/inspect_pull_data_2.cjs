const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- pullDataFromCloudDatabases continued (332900 - 336000) ---');
console.log(content.substring(332900, 336000));
