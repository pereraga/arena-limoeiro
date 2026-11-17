const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const getCourtIdx = code.indexOf('function getCourtById(cId)');
const getCourtEnd = code.indexOf('window.getCourtById = getCourtById;', getCourtIdx);
console.log('getCourtIdx:', getCourtIdx, 'getCourtEnd:', getCourtEnd);
console.log(code.substring(getCourtIdx, getCourtIdx + 200));
