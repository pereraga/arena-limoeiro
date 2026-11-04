const fs = require('fs');
const html = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html', 'utf8');
const lines = html.split('\n');

for (let i = 7240; i <= lines.length; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
