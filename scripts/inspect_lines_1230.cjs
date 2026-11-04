const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'default-data.js'), 'utf8');
const lines = content.split('\n');
console.log(lines.slice(1215, 1260).join('\n'));
