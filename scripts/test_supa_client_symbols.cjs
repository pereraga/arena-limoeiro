const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'supabase-client.js'), 'utf8');

console.log('supabase-client contains getMatchesForDate:', content.includes('getMatchesForDate'));
console.log('supabase-client contains renderMovementMatches:', content.includes('renderMovementMatches'));
console.log('supabase-client contains adminGameState:', content.includes('adminGameState'));
console.log('supabase-client contains movementMatchesListContainer:', content.includes('movementMatchesListContainer'));
