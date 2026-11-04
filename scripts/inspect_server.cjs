const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const serverPath = path.join(root, 'server.js');
console.log('server.js size:', fs.statSync(serverPath).size);
console.log(fs.readFileSync(serverPath, 'utf8').slice(0, 600));
