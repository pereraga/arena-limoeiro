const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const adminPath = path.join(targetDir, 'public/admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

for (let j = 7100; j < 7180; j++) {
  console.log(`${j+1}: ${lines[j]}`);
}
