const fs = require('fs');
const path = require('path');

const targetDir = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const syncApiPath = path.join(targetDir, 'api/sync.js');
const content = fs.readFileSync(syncApiPath, 'utf8');

console.log('=== api/sync.js content ===');
console.log(content);
