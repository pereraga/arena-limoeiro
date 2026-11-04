const fs = require('fs');
const html = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html', 'utf8');
const lines = html.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('handleSaveDirectBooking')) {
    console.log(`Line ${idx + 1}: ${line}`);
    for (let j = idx; j < idx + 40 && j < lines.length; j++) {
      console.log(`  ${lines[j]}`);
    }
  }
});
