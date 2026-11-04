const fs = require('fs');

function findFetches(file) {
  console.log(`\n=== Fetches in ${file} ===`);
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('fetch(')) {
      console.log(`L${idx+1}: ${line.trim().slice(0, 140)}`);
    }
  });
}

findFetches('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html');
findFetches('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/index.html');
