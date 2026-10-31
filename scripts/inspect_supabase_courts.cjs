const fs = require('fs');

const supaJs = fs.readFileSync('public/supabase-client.js', 'utf8');
const lines = supaJs.split('\n');

console.log('Total lines in supabase-client.js:', lines.length);
lines.forEach((l, idx) => {
  if (l.includes('courts') || l.includes('fetchCourts') || l.includes('loadCourts') || l.includes('secondaryClient')) {
    console.log(idx + ': ' + l.trim());
  }
});
