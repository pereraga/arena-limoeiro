const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find how matches/bookings are stored in memory and in localStorage/Supabase
const idx = html.indexOf('function pullMatchesFromCloud');
if (idx !== -1) {
  console.log('pullMatchesFromCloud found:');
  console.log(html.substring(idx, idx + 1000));
} else {
  console.log('Searching for matches storage...');
  const m = [...html.matchAll(/localStorage\.getItem\(['"]([^'"]*match[^'"]*|[^'"]*book[^'"]*)['"]\)/gi)];
  m.forEach(x => console.log(x[0]));
}
