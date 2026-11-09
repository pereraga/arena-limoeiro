const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

const funcIdx = content.indexOf('window.toggleBalcaoTimeSlot = function(slotTime)');
if (funcIdx === -1) {
    console.error('not found');
    process.exit(1);
}

const slice = content.substring(funcIdx, funcIdx + 3000);
console.log(slice);
