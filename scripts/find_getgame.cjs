const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('=== Lines 5500 to 6000 searching for monthlyMembers / getMatchesForDate / getGame ===');
lines.forEach((l, i) => {
  if (l.includes('function getGame') || l.includes('getMatchesForDate') || l.includes('syncBookingToCloud') || l.includes('syncMemberToCloud')) {
    console.log(`Line ${i+1}: ${l.trim().slice(0, 140)}`);
  }
});
