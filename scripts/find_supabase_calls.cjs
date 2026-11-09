const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const regex = /(?:supabase|fetch|api\/)/gi;
// Find supabase calls or api calls
const supaMatches = [...content.matchAll(/from\(['"](\w+)['"]\)/g)].map(m => m[1]);
console.log('Supabase tables referenced:', [...new Set(supaMatches)]);

// Find initAdmin
let pos = 0;
while ((pos = content.indexOf('initAdmin', pos)) !== -1) {
  console.log('initAdmin at:', pos);
  console.log(content.substring(Math.max(0, pos - 100), Math.min(content.length, pos + 300)));
  pos += 'initAdmin'.length;
}
