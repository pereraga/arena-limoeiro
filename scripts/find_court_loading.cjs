const fs = require('fs');

const appJs = fs.readFileSync('public/app.js', 'utf8');
const lines = appJs.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('loadCourts') || lines[i].includes('fetchCourts') || lines[i].includes('arena_local_courts') || lines[i].includes('arena_custom_court_photos')) {
    console.log(i + ': ' + lines[i].trim());
  }
}
