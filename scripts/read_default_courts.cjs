const fs = require('fs');

const defData = fs.readFileSync('public/default-data.js', 'utf8');
const lines = defData.split('\n');

let courtsStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const initialCourts =') || lines[i].includes('const defaultCourts =')) {
    courtsStart = i;
    break;
  }
}

console.log('courtsStart at line:', courtsStart);
if (courtsStart !== -1) {
  for (let j = courtsStart; j < courtsStart + 120 && j < lines.length; j++) {
    console.log(j + ': ' + lines[j]);
  }
}
