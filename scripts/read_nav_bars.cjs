const fs = require('fs');

const content = fs.readFileSync('public/app.js', 'utf8');
const lines = content.split('\n');

for (let i = 6228; i < 6325 && i < lines.length; i++) {
  console.log(i + ': ' + lines[i]);
}
