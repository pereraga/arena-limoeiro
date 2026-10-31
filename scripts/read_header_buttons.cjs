const fs = require('fs');

const content = fs.readFileSync('public/app.js', 'utf8');
const lines = content.split('\n');

for (let i = 6220; i < 6250 && i < lines.length; i++) {
  console.log(i + ': ' + lines[i]);
}
