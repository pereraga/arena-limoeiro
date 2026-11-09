const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Look for window.renderMovementMatches definition and all places where it's called
const defIdx = content.indexOf('function renderMovementMatches');
console.log('function renderMovementMatches at:', defIdx);
if (defIdx !== -1) {
  console.log(content.substring(defIdx, defIdx + 600));
}

// Where is loadBookings or fetchBookings or similar database syncing function?
const syncKeywords = ['loadBookings', 'syncData', 'syncFromDatabase', 'fetchBookings', 'initAdmin', 'window.adminGameState'];
syncKeywords.forEach(k => {
  const matches = [...content.matchAll(new RegExp(k, 'g'))];
  console.log(`Keyword ${k}: ${matches.length} occurrences`);
});
