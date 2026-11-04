const fs = require('fs');
const html = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html', 'utf8');
const lines = html.split('\n');

function printRange(title, start, end) {
  console.log(`\n=== ${title} (lines ${start}-${end}) ===`);
  for (let i = start - 1; i < end && i < lines.length; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

printRange('CARD ACTIONS', 5920, 5970);
printRange('DETAILS ACCORDION / ACTIONS', 6070, 6115);
