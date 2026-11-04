const fs = require('fs');
const html = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html', 'utf8');
const lines = html.split('\n');
for (let i = 6140; i <= 6210; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
