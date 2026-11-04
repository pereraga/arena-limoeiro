const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const lines = content.split('\n');
let inside = false;
let start = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('window.renderMovementMatches = function') || lines[i].includes('function renderMovementMatches')) {
    start = i;
    break;
  }
}

console.log('renderMovementMatches found at line:', start + 1);
console.log(lines.slice(start, start + 120).join('\n'));
