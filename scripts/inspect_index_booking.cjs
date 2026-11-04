const fs = require('fs');
const html = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/index.html', 'utf8');
const lines = html.split('\n');

for (let i = 1770; i <= 1850; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
