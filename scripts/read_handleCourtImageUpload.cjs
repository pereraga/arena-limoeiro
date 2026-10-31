const fs = require('fs');

const appJs = fs.readFileSync('public/app.js', 'utf8');
const lines = appJs.split('\n');

for (let i = 20230; i < 20380 && i < lines.length; i++) {
  console.log(i + ': ' + lines[i]);
}
