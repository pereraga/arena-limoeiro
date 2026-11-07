const fs = require('fs');
const html = fs.readFileSync('public/admin.html', 'utf8');

// Find the actual definition of getBalcaoOccupiedRanges
let idx = -1;
let count = 0;
while ((idx = html.indexOf('getBalcaoOccupiedRanges', idx+1)) !== -1 && count < 20) {
  count++;
  const ctx = html.substring(idx - 30, idx + 100);
  console.log('pos:', idx, '| ctx:', ctx.replace(/\n/g, '\\n'));
  console.log();
}
