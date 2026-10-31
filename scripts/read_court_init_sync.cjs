const fs = require('fs');

const appJs = fs.readFileSync('public/app.js', 'utf8');
const lines = appJs.split('\n');

console.log('--- Lines 1990 to 2040 ---');
for (let i = 1990; i < 2040 && i < lines.length; i++) {
  console.log(i + ': ' + lines[i]);
}

console.log('--- Lines 23115 to 23260 ---');
for (let i = 23115; i < 23260 && i < lines.length; i++) {
  console.log(i + ': ' + lines[i]);
}

console.log('--- Lines 23570 to 23620 ---');
for (let i = 23570; i < 23620 && i < lines.length; i++) {
  console.log(i + ': ' + lines[i]);
}
