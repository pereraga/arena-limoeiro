const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const target = 'renderBalcaoTimeSlots';
let idx = 0;
while ((idx = html.indexOf(target, idx)) !== -1) {
    console.log('Found renderBalcaoTimeSlots at index:', idx);
    console.log(html.substring(idx - 40, idx + 80).replace(/\n/g, ' '));
    idx += target.length;
}
