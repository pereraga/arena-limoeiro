const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Extract ARENA_CLOUD_DBS definition
const dbIdx = content.indexOf('const ARENA_CLOUD_DBS =');
console.log('ARENA_CLOUD_DBS:');
console.log(content.substring(dbIdx, dbIdx + 800));
