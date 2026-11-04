const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('supabase.co') || l.includes('SUPABASE_KEY') || l.includes('aukrcnhuyultkjqsgvea')) {
    console.log(`${idx + 1}: ${l.trim().slice(0, 120)}`);
  }
});
