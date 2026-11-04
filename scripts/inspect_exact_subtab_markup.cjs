const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const startTarget = 'id="panel-cadastros"';
const startIdx = content.indexOf(startTarget);
const endTarget = 'id="subtab-content-jogos"';
const endIdx = content.indexOf(endTarget);

console.log(content.substring(startIdx, endIdx));
