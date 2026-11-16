const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find persistCourtState implementation
const idx = html.indexOf('async function persistCourtState');
console.log(html.substring(idx, idx + 1800));
