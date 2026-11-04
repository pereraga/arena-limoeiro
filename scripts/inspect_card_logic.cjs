const fs = require('fs');
const html = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html', 'utf8');
const lines = html.split('\n');

function printRange(title, start, end) {
  console.log(`\n=== ${title} (lines ${start}-${end}) ===`);
  for (let i = start - 1; i < end && i < lines.length; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

printRange('CALCULATE MATCH STATUS / TIME', 5390, 5435);
printRange('RENDER MATCH CARD HTML', 5755, 5840);
