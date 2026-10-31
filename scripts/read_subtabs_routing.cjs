const fs = require('fs');

const content = fs.readFileSync('public/app.js', 'utf8');
const lines = content.split('\n');

for (let i = 10960; i < 11000 && i < lines.length; i++) {
  console.log(i + ': ' + lines[i]);
}
