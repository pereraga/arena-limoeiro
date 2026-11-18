const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const adminPath = path.join(targetDir, 'public/admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const lines = content.split('\n');
const found = [];
lines.forEach((line, idx) => {
  if (line.includes('localStorage.setItem') || line.includes('localStorage.getItem')) {
    found.push({ line: idx + 1, text: line.trim() });
  }
});

console.log('Total localStorage lines:', found.length);
found.forEach(f => console.log(`${f.line}: ${f.text}`));
