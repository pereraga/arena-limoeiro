const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const idx = code.indexOf('window.pullDataFromCloudDatabases =');
console.log(code.substring(idx, idx + 2500));
