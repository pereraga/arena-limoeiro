const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Check if any other variable is used without declaration
console.log('admin.html loaded.');
// Search for ReferenceError potential identifiers:
const getMatchesIdx = content.indexOf('function getMatchesForDate(dateStr) {');
const endMatchesIdx = content.indexOf('function renderMovementMatches() {');
const funcBody = content.substring(getMatchesIdx, endMatchesIdx);

// Check variables used in funcBody
const lines = funcBody.split('\n');
console.log(`getMatchesForDate has ${lines.length} lines.`);
