const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

function findOccurrences(term) {
  console.log(`\n=== Occurrences of: ${term} ===`);
  let idx = 0;
  while ((idx = content.indexOf(term, idx)) !== -1) {
    const lineNum = content.substring(0, idx).split('\n').length;
    console.log(`Line ${lineNum}:`);
    console.log(content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + 400)));
    console.log('--------------------------------------------------');
    idx += term.length;
  }
}

findOccurrences('movementDaysStrip');
