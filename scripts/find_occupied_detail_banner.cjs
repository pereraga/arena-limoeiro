const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find showBalcaoOccupiedDetail definition
const idx = html.indexOf('window.showBalcaoOccupiedDetail = function');
console.log('showBalcaoOccupiedDetail at', idx);
if (idx !== -1) {
  console.log(html.substring(idx, idx + 1000));
}
