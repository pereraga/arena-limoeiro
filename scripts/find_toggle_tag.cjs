const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find balcaoHideOccupiedToggle in HTML to see if checked attribute is present
const m = html.match(/<input[^>]*id=["']balcaoHideOccupiedToggle["'][^>]*>/i);
console.log('Toggle input tag:', m ? m[0] : 'not found');
