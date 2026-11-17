const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find balcaoScheduledGamesList
const m = [...html.matchAll(/balcaoScheduledGamesList/g)];
console.log('balcaoScheduledGamesList count:', m.length);
m.forEach(x => {
  console.log('At', x.index);
  console.log(html.substring(x.index - 50, x.index + 200));
});
