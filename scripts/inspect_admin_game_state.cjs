const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

// Find where adminGameState is defined
const scriptStart = content.indexOf('<script id="admin-game-system">');
const nextScript = content.indexOf('</script>', scriptStart);
console.log('Script tag found:', scriptStart, nextScript);

// Let's search for "window.adminGameState = "
const gsIdx = content.indexOf('window.adminGameState =');
console.log('adminGameState pos:', gsIdx);
if (gsIdx !== -1) {
  console.log(content.substring(gsIdx, gsIdx + 1500));
}
