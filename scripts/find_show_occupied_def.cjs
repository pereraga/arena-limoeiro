const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'function showBalcaoOccupiedDetail';
let idx = 0;
while ((idx = html.indexOf(target, idx)) !== -1) {
    console.log('Found showBalcaoOccupiedDetail at:', idx);
    console.log(html.substring(idx, idx + 1000));
    idx += target.length;
}

const target2 = 'window.showBalcaoOccupiedDetail =';
idx = 0;
while ((idx = html.indexOf(target2, idx)) !== -1) {
    console.log('Found window.showBalcaoOccupiedDetail at:', idx);
    console.log(html.substring(idx, idx + 1000));
    idx += target2.length;
}
