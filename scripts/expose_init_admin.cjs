const fs = require('fs');
let content = fs.readFileSync('public/admin.html', 'utf8');

if (!content.includes('window.initAdminGames = initAdminGames;')) {
  content = content.replace(
    'function initAdminGames() {',
    'window.initAdminGames = initAdminGames;\n  function initAdminGames() {'
  );
  fs.writeFileSync('public/admin.html', content, 'utf8');
  console.log('✓ Added window.initAdminGames = initAdminGames;');
} else {
  console.log('window.initAdminGames already exposed');
}
