const fs = require('fs');

const content = fs.readFileSync('public/app.js', 'utf8');
const lines = content.split('\n');

for (let i = 13420; i < 13530 && i < lines.length; i++) {
  if (lines[i].includes('initFinanceCharts')) {
    console.log('initFinanceCharts at line:', i);
    for (let j = i; j < i + 180 && j < lines.length; j++) {
      console.log(j + ': ' + lines[j]);
    }
    break;
  }
}
