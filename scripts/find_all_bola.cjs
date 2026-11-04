const fs = require('fs');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');

const regex = /bola/gi;
let m;
const occurrences = [];
while ((m = regex.exec(adminHtml)) !== null) {
  const start = Math.max(0, m.index - 80);
  const end = Math.min(adminHtml.length, m.index + 120);
  occurrences.push({
    index: m.index,
    snippet: adminHtml.slice(start, end).replace(/\n/g, ' ')
  });
}

console.log(`Total occurrences of 'bola' in admin.html: ${occurrences.length}`);
occurrences.forEach((occ, i) => {
  console.log(`[${i+1}] (idx: ${occ.index}): ${occ.snippet}`);
});
