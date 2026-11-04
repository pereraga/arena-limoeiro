const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const target = 'id="subtab-content-supabase"';
const idx = content.indexOf(target);
console.log(content.substring(idx + 3500, idx + 6000));
