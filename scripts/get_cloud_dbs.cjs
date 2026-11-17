const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find cloudDbs definition to query Supabase directly
const m = html.match(/const cloudDbs = \{[\s\S]*?\};/);
if (m) console.log(m[0]);
else console.log('cloudDbs not found');
