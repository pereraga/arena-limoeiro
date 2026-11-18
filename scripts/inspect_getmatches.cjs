const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const adminPath = path.join(targetDir, 'public/admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function getMatchesForDate') || lines[i].includes('window.getMatchesForDate')) {
    console.log(`Found getMatchesForDate at line ${i+1}`);
    for (let j = i; j < Math.min(lines.length, i + 80); j++) {
      console.log(`${j+1}: ${lines[j]}`);
    }
    break;
  }
}
