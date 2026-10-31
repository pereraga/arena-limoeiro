const fs = require('fs');

const syncJs = fs.readFileSync('api/sync.js', 'utf8');
const lines = syncJs.split('\n');

console.log('Total lines in api/sync.js:', lines.length);
lines.forEach((l, idx) => {
  if (l.includes('courts') || l.includes('court') || l.includes('image') || l.includes('gallery')) {
    if (idx < 250) console.log(idx + ': ' + l.trim());
  }
});
