const fs = require('fs');
const html = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html', 'utf8');
const lines = html.split('\n');

for (let i = 3054; i <= 3120; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
