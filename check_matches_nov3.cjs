const fs = require('fs');

const html = fs.readFileSync('public/admin.html', 'utf8');
const defaultData = fs.readFileSync('public/default-data.js', 'utf8');

const window = {
  adminGameState: {
    selectedDate: '2026-11-03',
    movementFilterCourt: 'all',
    movementFilterStatus: 'all',
    bookings: [],
    monthlyMembers: []
  }
};

eval(defaultData);
window.adminGameState.bookings = window.ARENA_DEFAULT_DATA.initialBookings;
window.adminGameState.monthlyMembers = window.ARENA_DEFAULT_DATA.initialMonthlyMembers;

// Extract getMatchesForDate and helper functions from html
const fnRegex = /function getMatchesForDate[\s\S]*?return matches;\s*\}/;
const match = html.match(fnRegex);
if (!match) {
  console.error('getMatchesForDate not found');
  process.exit(1);
}

// Also get getCourtById
const courtFnMatch = html.match(/function getCourtById[\s\S]*?return[\s\S]*?\}/);

function getCourtById(id) {
  const courts = window.ARENA_DEFAULT_DATA.initialCourts || [];
  return courts.find(c => c.id === id) || { id: id || 'court-1', name: 'QUADRA SOCIETY', normal: 100 };
}

eval(match[0]);

const matches = getMatchesForDate('2026-11-03');
console.log('Total matches for 2026-11-03:', matches.length);
console.log(matches.map(m => ({
  id: m.id,
  court_id: m.court_id,
  court_name: m.court_name,
  time: m.start_time + ' às ' + m.end_time,
  customer_name: m.customer_name,
  status: m.status,
  price: m.total_price
})));
