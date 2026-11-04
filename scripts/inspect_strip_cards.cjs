const fs = require('fs');

// Let's inspect all 21 dates in the strip
const dates = [
  '2026-10-29', '2026-10-30', '2026-10-31',
  '2026-11-01', '2026-11-02', '2026-11-03',
  '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07',
  '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11',
  '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15',
  '2026-11-16', '2026-11-17', '2026-11-18'
];

console.log('Inspecting strip dates...');
const adminHtml = fs.readFileSync('public/admin.html', 'utf8');

// Let's check how many day cards exist in movementDaysStrip HTML
const stripMatch = adminHtml.match(/<div id="movementDaysStrip"[\s\S]*?<\/div>\s*<\/div>\s*<!-- =/);
if (stripMatch) {
  const stripHtml = stripMatch[0];
  const cardMatches = stripHtml.match(/<div class="min-w-\[7[05]px\][\s\S]*?<\/div>/g);
  console.log(`Day cards found in strip HTML: ${cardMatches ? cardMatches.length : 0}`);
  if (cardMatches) {
    cardMatches.forEach((card, idx) => {
      const text = card.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`Card ${idx+1}: ${text}`);
    });
  }
}
