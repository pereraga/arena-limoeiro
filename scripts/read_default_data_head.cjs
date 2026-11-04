const fs = require('fs');

const content = fs.readFileSync('public/default-data.js', 'utf8');
console.log('Size:', content.length);
console.log('Head:\n', content.slice(0, 500));
console.log('Tail:\n', content.slice(-500));
