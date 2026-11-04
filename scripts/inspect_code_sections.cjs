const fs = require('fs');
const html = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html', 'utf8');
const lines = html.split('\n');

function printRange(title, start, end) {
  console.log(`\n=== ${title} (lines ${start}-${end}) ===`);
  for (let i = start - 1; i < end && i < lines.length; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

printRange('HTML FILTER CONTROLS', 1375, 1425);
printRange('GETMATCHESFORDATE', 4235, 4320);
printRange('RENDERMOVEMENTMATCHES', 6140, 6245);
printRange('INITADMINGAMES', 7055, 7123);
