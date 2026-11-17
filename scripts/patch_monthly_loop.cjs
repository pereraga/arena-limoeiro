const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(adminPath, 'utf8');

const target = "window.adminGameState.monthlyMembers || []).forEach(m => {\n      if (!m || m.status === 'inactive') return;";
const replacement = `window.adminGameState.monthlyMembers || []).forEach(m => {
      if (!m || m.status === 'inactive') return;
      if (window.__arenaCloudTombstones && (window.__arenaCloudTombstones.has(String(m.id)) || window.__arenaCloudTombstones.has('monthly-' + String(m.id)))) return;
      if (window.__arenaCloudMemberTombstones && window.__arenaCloudMemberTombstones.has(String(m.id))) return;`;

if (html.includes(target)) {
  html = html.replace(target, replacement);
  console.log('Successfully replaced monthlyMembers loop with tombstone checks');
  fs.writeFileSync(adminPath, html, 'utf8');
} else {
  console.log('Target string not found');
}
