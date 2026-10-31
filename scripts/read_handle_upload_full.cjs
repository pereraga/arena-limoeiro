const fs = require('fs');

const appJs = fs.readFileSync('public/app.js', 'utf8');
const lines = appJs.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function handleCourtImageUpload')) {
    console.log('handleCourtImageUpload at line:', i);
    for (let j = i; j < i + 60 && j < lines.length; j++) {
      console.log(j + ': ' + lines[j]);
    }
    break;
  }
}
