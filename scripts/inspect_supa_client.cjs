const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'supabase-client.js'), 'utf8');
console.log('supabase-client.js length:', content.length);
console.log(content.slice(0, 500));
