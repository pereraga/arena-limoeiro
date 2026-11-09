const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking BroadcastChannel and Realtime setup ---');
const idx = content.indexOf('setupArenaRealtimeSync');
console.log(content.substring(idx - 50, idx + 2000));
