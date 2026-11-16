const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const targets = ['observation', 'notes', 'observacoes', 'observação', 'obs'];
targets.forEach(t => {
  const regex = new RegExp(`(match|game|b|m|item)\\.${t}`, 'g');
  let match;
  while ((match = regex.exec(html)) !== null) {
    const idx = match.index;
    console.log(`Found ${match[0]} at ${idx}:`);
    console.log(html.substring(Math.max(0, idx - 100), Math.min(html.length, idx + 200)).replace(/\n/g, ' '));
  }
});
