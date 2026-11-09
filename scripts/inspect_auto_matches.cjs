const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('--- Checking error in renderMovementMatches or preceding scripts ---');
// Let's check checkAndAutoStartMatches and checkAndAutoExpireMatches
const casm = content.indexOf('function checkAndAutoStartMatches');
if (casm !== -1) {
  console.log('checkAndAutoStartMatches:\n', content.substring(casm, casm + 800));
}

const caem = content.indexOf('function checkAndAutoExpireMatches');
if (caem !== -1) {
  console.log('checkAndAutoExpireMatches:\n', content.substring(caem, caem + 800));
}
