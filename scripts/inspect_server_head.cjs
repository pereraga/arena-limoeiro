const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'server.js');
const content = fs.readFileSync(serverPath, 'utf8');

console.log('--- Lines 1-60 of server.js ---');
console.log(content.split('\n').slice(0, 60).join('\n'));
