const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const startIdx = html.indexOf('window.renderBalcaoTimeSlots = function');
const endIdx = html.indexOf('window.undoLastBalcaoTimeSlot = function');
console.log('Start:', startIdx, 'End:', endIdx, 'Length:', endIdx - startIdx);
console.log(html.substring(startIdx, endIdx));
