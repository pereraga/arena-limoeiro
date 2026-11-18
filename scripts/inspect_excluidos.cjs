const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const adminPath = path.join(targetDir, 'public/admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

[7153, 12333, 13532, 13713].forEach(lineNum => {
  console.log(`=== Line ${lineNum} ===`);
  for (let i = lineNum - 5; i <= lineNum + 20 && i < lines.length; i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
});
