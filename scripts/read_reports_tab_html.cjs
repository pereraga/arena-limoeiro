const fs = require('fs');

const content = fs.readFileSync('public/app.js', 'utf8');
const lines = content.split('\n');

let start = -1;
let end = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function renderAdminReportsTab()')) {
    start = i;
  }
  if (start !== -1 && i > start && lines[i].includes('window.renderAdminReportsTab = renderAdminReportsTab;')) {
    end = i;
    break;
  }
}

console.log('renderAdminReportsTab starts at line', start, 'ends at', end);
for (let i = start; i <= end && i < lines.length; i++) {
  console.log(i + ': ' + lines[i]);
}
