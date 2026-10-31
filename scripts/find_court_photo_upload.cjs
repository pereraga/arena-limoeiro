const fs = require('fs');

const appJs = fs.readFileSync('public/app.js', 'utf8');
const lines = appJs.split('\n');

console.log('Searching for court photo upload logic...');
lines.forEach((l, idx) => {
  if (l.includes('upload') || l.includes('image') || l.includes('courtModal') || l.includes('handleSaveCourt')) {
    if (l.includes('court') && (l.includes('image') || l.includes('file') || l.includes('photo') || l.includes('save') || l.includes('upload'))) {
      console.log(idx + ': ' + l.trim());
    }
  }
});
