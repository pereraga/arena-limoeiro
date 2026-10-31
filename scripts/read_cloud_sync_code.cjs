const fs = require('fs');

const supaJs = fs.readFileSync('public/supabase-client.js', 'utf8');
const lines = supaJs.split('\n');

for (let i = 1010; i < 1073 && i < lines.length; i++) {
  console.log(i + ': ' + lines[i]);
}
