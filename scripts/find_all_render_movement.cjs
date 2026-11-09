const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Find all occurrences of renderMovementMatches
let pos = 0;
while ((pos = content.indexOf('renderMovementMatches', pos)) !== -1) {
  console.log('renderMovementMatches call/def at:', pos);
  console.log(content.substring(Math.max(0, pos - 50), Math.min(content.length, pos + 100)));
  pos += 'renderMovementMatches'.length;
}
