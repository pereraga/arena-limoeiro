const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const lines = fs.readFileSync(adminPath, 'utf8').split('\n');

console.log('Searching for Balcão slots rendering...');
lines.forEach((l, i) => {
  if (l.includes('renderBalcaoTimeSlots') || l.includes('Ocultar Indisponíveis') || l.includes('toggleBalcaoTimeSlot') || l.includes('getBalcaoOccupiedRanges') || l.includes('directBookingDate')) {
    console.log(`Line ${i+1}: ${l.trim().slice(0, 140)}`);
  }
});
