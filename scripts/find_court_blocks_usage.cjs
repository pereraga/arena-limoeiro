const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const pos = html.indexOf('courtState.blocks');
let idx = 0;
while ((idx = html.indexOf('courtState.blocks', idx)) !== -1) {
  console.log('Found courtState.blocks at:', idx);
  console.log(html.substring(Math.max(0, idx - 50), Math.min(html.length, idx + 150)).replace(/\n/g, ' '));
  idx += 'courtState.blocks'.length;
}

const posOccupied = html.indexOf('window.getBalcaoOccupiedRanges =');
console.log('getBalcaoOccupiedRanges pos:', posOccupied);
