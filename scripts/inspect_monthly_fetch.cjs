const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const adminPath = path.join(targetDir, 'public/admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('fetchMonthlyMembers') || lines[i].includes('loadMonthlyMembers') || lines[i].includes('arena_cached_monthly_v2')) {
    console.log(`Found reference at line ${i+1}: ${lines[i]}`);
    for (let j = Math.max(0, i - 10); j < Math.min(lines.length, i + 40); j++) {
      console.log(`${j+1}: ${lines[j]}`);
    }
    break;
  }
}
