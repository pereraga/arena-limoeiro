const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const targets = ['function newCourtBlock', 'function deleteCourtBlock', 'courtBlockListContainer'];
targets.forEach(t => {
  const pos = html.indexOf(t);
  console.log(`Pos of "${t}":`, pos);
  if (pos !== -1) {
    console.log(html.substring(pos, pos + 1200));
  }
});
