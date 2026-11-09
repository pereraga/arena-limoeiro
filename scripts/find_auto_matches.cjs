const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('window.checkAndAutoStartMatches index:', content.indexOf('checkAndAutoStartMatches'));
console.log('window.checkAndAutoExpireMatches index:', content.indexOf('checkAndAutoExpireMatches'));

const idx = content.indexOf('checkAndAutoStartMatches');
if (idx !== -1) {
  console.log(content.substring(idx - 100, idx + 400));
}
