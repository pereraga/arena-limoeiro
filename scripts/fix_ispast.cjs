const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Replace isPastOrDay3 with isPast in getMatchesForDate
if (!content.includes('isPastOrDay3')) {
  console.log('No isPastOrDay3 found in file!');
  process.exit(1);
}

const updated = content.replaceAll('isPastOrDay3', 'isPast');
fs.writeFileSync(adminPath, updated, 'utf8');
console.log('Successfully replaced all occurrences of isPastOrDay3 with isPast!');
