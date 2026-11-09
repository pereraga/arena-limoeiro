const fs = require('fs');

let content = fs.readFileSync('public/default-data.js', 'utf8');

const regex1 = /\{\s*"id":\s*"mensal-1792439794116"[\s\S]*?\},/g;
const regex2 = /\{\s*"id":\s*"mensal-1793035235873"[\s\S]*?\},/g;

content = content.replace(regex1, '');
content = content.replace(regex2, '');

fs.writeFileSync('public/default-data.js', content, 'utf8');
console.log('Removed duplicate monthly members from default-data.js!');
