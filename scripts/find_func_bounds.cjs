const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const sIdx = content.indexOf('function getMatchesForDate(dateStr) {');
console.log('getMatchesForDate starts at:', sIdx);
// Find where it ends
let braceCount = 0;
let started = false;
let endIdx = -1;
for (let i = sIdx; i < content.length; i++) {
  if (content[i] === '{') {
    braceCount++;
    started = true;
  } else if (content[i] === '}') {
    braceCount--;
    if (started && braceCount === 0) {
      endIdx = i;
      break;
    }
  }
}
console.log('getMatchesForDate ends at:', endIdx, 'length:', endIdx - sIdx);

// Now do the same for renderMovementMatches
const rIdx = content.indexOf('function renderMovementMatches() {');
braceCount = 0;
started = false;
let rEndIdx = -1;
for (let i = rIdx; i < content.length; i++) {
  if (content[i] === '{') {
    braceCount++;
    started = true;
  } else if (content[i] === '}') {
    braceCount--;
    if (started && braceCount === 0) {
      rEndIdx = i;
      break;
    }
  }
}
console.log('renderMovementMatches ends at:', rEndIdx, 'length:', rEndIdx - rIdx);
