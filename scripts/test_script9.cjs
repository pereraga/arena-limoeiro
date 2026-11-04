const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');

const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = regex.exec(content)) !== null) {
  count++;
  if (count === 9) {
    const s9 = match[1];
    console.log('Script 9 contains getMatchesForDate:', s9.includes('getMatchesForDate'));
    console.log('Script 9 contains renderMovementMatches:', s9.includes('renderMovementMatches'));
    console.log('Script 9 contains movementMatchesListContainer:', s9.includes('movementMatchesListContainer'));
    console.log('Script 9 contains Davi:', s9.includes('Davi'));
  }
}
