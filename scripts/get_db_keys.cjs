const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const mUrl = content.match(/db2Url:\s*'([^']+)'/);
const mKey = content.match(/db2Key:\s*'([^']+)'/);

console.log('DB2 URL:', mUrl ? mUrl[1] : null);
console.log('DB2 Anon Key:', mKey ? mKey[1] : null);
