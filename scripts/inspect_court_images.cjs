const fs = require('fs');

const appJs = fs.readFileSync('public/app.js', 'utf8');
const lines = appJs.split('\n');

console.log('Searching for court.image or defaultCourts or image fallback...');
lines.forEach((l, idx) => {
  if (l.includes('court.image') || l.includes('court.gallery') || l.includes('supabase') && l.includes('courts')) {
    if (idx < 5000 || idx > 15000) {
      // sample some
    }
  }
});

// Also check default-data.js
if (fs.existsSync('public/default-data.js')) {
  const defData = fs.readFileSync('public/default-data.js', 'utf8');
  console.log('--- default-data.js preview ---');
  console.log(defData.slice(0, 1500));
}
