const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const targets = ['pullDataFromCloudDatabases', 'setupArenaRealtimeSync', 'purgeExpiredCloudBookings'];
targets.forEach(t => {
  const idx = content.indexOf('function ' + t);
  const idx2 = content.indexOf(t + ' =');
  const idx3 = content.indexOf(t);
  console.log(`${t}: funcIdx=${idx}, assignIdx=${idx2}, firstIdx=${idx3}`);
  if (idx3 !== -1) {
    console.log(`--- ${t} snippet ---`);
    console.log(content.substring(idx3, idx3 + 800));
  }
});
