const fs = require('fs');

const syncJs = fs.readFileSync('api/sync.js', 'utf8');
const lines = syncJs.split('\n');

for (let i = 330; i < 417 && i < lines.length; i++) {
  console.log(i + ': ' + lines[i]);
}
