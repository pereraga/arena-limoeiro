const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const adminPath = path.join(targetDir, 'public/admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const lines = content.split('\n');
for (let j = 6910; j < 6986; j++) {
  console.log(`${j+1}: ${lines[j]}`);
}
