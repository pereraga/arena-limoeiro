const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('id="subtab-content-modalidades"');
const endPanel = content.indexOf('</section>', idx);
console.log('subtab-content-modalidades at:', idx, 'end of panel-cadastros at:', endPanel);
console.log(content.substring(endPanel - 200, endPanel + 50));
