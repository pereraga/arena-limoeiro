const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const idx = content.indexOf('const bc = new BroadcastChannel(\'arena_limoeiro_sync\');\n    bc.onmessage');
if (idx !== -1) {
  console.log(content.substring(idx, idx + 1000));
} else {
  const p = content.indexOf('bc.onmessage =');
  console.log(content.substring(p - 100, p + 600));
}
