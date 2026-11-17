const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find slot generation in Javascript
const idx = html.indexOf("window.renderBalcaoTimeSlots = function");
console.log('renderBalcaoTimeSlots at', idx);
console.log(html.substring(idx + 7000, idx + 10500));
