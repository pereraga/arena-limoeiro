const fs = require('fs');
const repoRoot = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const content = fs.readFileSync(repoRoot + '/public/admin.html', 'utf8');

const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = regex.exec(content)) !== null) {
  count++;
  if (count === 14) {
    const code = match[1];
    // Use standard acorn or node --check via temporary file
    fs.writeFileSync(repoRoot + '/scripts/temp_script_14.js', code);
    console.log('Saved temp_script_14.js');
    break;
  }
}
