const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(adminPath, 'utf8');

// 1. Inserir tombstone check em monthlyMembers loop
const target1 = '(window.adminGameState.monthlyMembers || []).forEach(m => {';
const replacement1 = `(window.adminGameState.monthlyMembers || []).forEach(m => {
      if (!m || m.status === 'inactive') return;
      if (window.__arenaCloudTombstones && (window.__arenaCloudTombstones.has(String(m.id)) || window.__arenaCloudTombstones.has('monthly-' + String(m.id)))) return;
      if (window.__arenaCloudMemberTombstones && window.__arenaCloudMemberTombstones.has(String(m.id))) return;`;

html = html.replace(target1 + '\r\n      if (!m || m.status === \'inactive\') return;', replacement1);
html = html.replace(target1 + '\n      if (!m || m.status === \'inactive\') return;', replacement1);

// 2. Inserir cancelled check em cleanBookings
const target2 = 'if (window.__arenaCloudTombstones.has(String(b.id))) return false;\r\n          return true;';
const target2LF = 'if (window.__arenaCloudTombstones.has(String(b.id))) return false;\n          return true;';
const rep2 = `if (window.__arenaCloudTombstones.has(String(b.id))) return false;
          if (b.status === 'cancelled' && (b.observation?.includes('TOMBSTONE') || String(b.customer_name).includes('DELETED_SYNC'))) return false;
          return true;`;

if (html.includes(target2)) {
  html = html.replace(target2, rep2);
  console.log('Replaced target2 (CRLF)');
} else if (html.includes(target2LF)) {
  html = html.replace(target2LF, rep2);
  console.log('Replaced target2 (LF)');
}

fs.writeFileSync(adminPath, html, 'utf8');
console.log('Patched public/admin.html');
