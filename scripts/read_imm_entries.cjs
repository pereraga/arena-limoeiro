const fs = require('fs');
const content = fs.readFileSync('public/default-data.js', 'utf8');

console.log(content.substring(11540, 13000));
