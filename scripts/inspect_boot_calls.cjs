const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(path, 'utf8');

const pos = html.indexOf('window.addEventListener(\'DOMContentLoaded\'');
console.log('DOMContentLoaded pos:', pos);

const pos2 = html.indexOf('window.addEventListener(\'load\'');
console.log('load pos:', pos2);

// Check if renderMovementMatches is called at boot
const endScriptPos = html.lastIndexOf('renderMovementMatches();');
console.log('last renderMovementMatches call pos:', endScriptPos);
if (endScriptPos !== -1) {
  console.log(html.substring(endScriptPos - 400, endScriptPos + 400));
}
