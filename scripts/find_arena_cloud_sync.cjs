const fs = require('fs');

const appJs = fs.readFileSync('public/app.js', 'utf8');
const lines = appJs.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('ArenaCloudSync =') || lines[i].includes('window.ArenaCloudSync =')) {
    console.log('ArenaCloudSync at line:', i);
    for (let j = i; j < i + 60 && j < lines.length; j++) {
      console.log(j + ': ' + lines[j]);
    }
    break;
  }
}
