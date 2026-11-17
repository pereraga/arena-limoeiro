const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let code = fs.readFileSync(path, 'utf8');

// In applyNoShow:
// After:
// if (window.ARENA_CLOUD_DBS) {
// Add window.__arenaDualSyncHidden('delete', isMonthly ? 'monthly' : 'booking', bookingToDelete);

const targetStr = "if (window.ARENA_CLOUD_DBS) {";
const idx = code.indexOf(targetStr, 709867);
console.log('Found targetStr at:', idx);

const injection = `if (typeof window.__arenaDualSyncHidden === 'function') {
      window.__arenaDualSyncHidden('delete', isMonthly ? 'monthly' : 'booking', bookingToDelete);
    }
    if (window.ARENA_CLOUD_DBS) {`;

code = code.substring(0, idx) + injection + code.substring(idx + targetStr.length);

// Also in cancelGame:
const cancelIdx = code.indexOf("if (window.ARENA_CLOUD_DBS) {", idx + 200);
console.log('Found cancel targetStr at:', cancelIdx);
const cancelInjection = `if (typeof window.__arenaDualSyncHidden === 'function') {
      window.__arenaDualSyncHidden('delete', isMonthly ? 'monthly' : 'booking', { id: targetId, date: selDate });
    }
    if (window.ARENA_CLOUD_DBS) {`;
code = code.substring(0, cancelIdx) + cancelInjection + code.substring(cancelIdx + targetStr.length);

fs.writeFileSync(path, code, 'utf8');
console.log('Successfully injected __arenaDualSyncHidden into applyNoShow and cancelGame!');
