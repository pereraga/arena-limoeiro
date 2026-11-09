const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// We want to inspect toggleBalcaoTimeSlot implementation in content
console.log('admin.html loaded, size:', content.length);

// Look for toggleBalcaoTimeSlot
const idx = content.indexOf('toggleBalcaoTimeSlot');
console.log('toggleBalcaoTimeSlot found at:', idx);

// Let's find where toggleBalcaoTimeSlot is defined
const funcIdx = content.indexOf('window.toggleBalcaoTimeSlot = function(slotTime)');
console.log('window.toggleBalcaoTimeSlot definition at:', funcIdx);

if (funcIdx !== -1) {
    const slice = content.substring(funcIdx, funcIdx + 1200);
    console.log('Current slice:\n', slice);
} else {
    // search for just function toggleBalcaoTimeSlot
    const fIdx2 = content.indexOf('function toggleBalcaoTimeSlot');
    console.log('function toggleBalcaoTimeSlot at:', fIdx2);
    if (fIdx2 !== -1) {
        console.log('Current slice:\n', content.substring(fIdx2, fIdx2 + 1200));
    }
}
