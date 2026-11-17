const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find balcaoScheduledGamesContainer in JS
const idx = html.indexOf('balcaoScheduledGamesContainer');
console.log('balcaoScheduledGamesContainer in JS:');
const m = [...html.matchAll(/balcaoScheduledGamesContainer/g)];
m.forEach(x => {
  console.log('At', x.index);
  console.log(html.substring(x.index - 50, x.index + 200));
});
