const fs = require('fs');
const repoRoot = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const content = fs.readFileSync(repoRoot + '/public/admin.html', 'utf8');

const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = regex.exec(content)) !== null) {
  count++;
  const tagOpen = match[0].slice(0, match[0].indexOf('>') + 1);
  if (tagOpen.includes('src=')) {
    console.log('Script', count, 'external:', tagOpen);
  } else {
    console.log('Script', count, 'inline length:', match[1].length);
    try {
      new Function(match[1]);
      console.log('Script', count, 'SYNTAX OK');
    } catch(err) {
      console.error('Script', count, 'SYNTAX ERROR:', err.message);
    }
  }
}
