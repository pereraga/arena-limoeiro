const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');

console.log('--- Inspecting movementDaysStrip and onclicks ---');
const stripMatch = content.match(/<div id="movementDaysStrip"[\s\S]*?<\/div>\s*<\/div>\s*<!-- =/);
if (stripMatch) {
  console.log(stripMatch[0]);
}

console.log('\n--- Inspecting selectMovementDay definition ---');
const smdIdx = content.indexOf('window.selectMovementDay = function');
if (smdIdx !== -1) {
  console.log(content.substring(smdIdx, smdIdx + 1500));
}

console.log('\n--- Inspecting initAdminGames where dates and today are set ---');
const initIdx = content.indexOf('function initAdminGames()');
if (initIdx !== -1) {
  console.log(content.substring(initIdx, initIdx + 1200));
}
