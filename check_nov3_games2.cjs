const fs = require('fs');

const d = fs.readFileSync('public/default-data.js', 'utf8');
const window = {};
eval(d);

const bookings = window.ARENA_DEFAULT_DATA.initialBookings || [];
const monthly = window.ARENA_DEFAULT_DATA.initialMonthlyMembers || [];

console.log('Bookings on 2026-11-03:');
const nov3 = bookings.filter(b => b.date === '2026-11-03');
console.log(nov3.map(b => ({
  id: b.id,
  court_id: b.court_id,
  court_name: b.court_name,
  time: b.time || (b.start_time + ' às ' + b.end_time),
  start_time: b.start_time,
  end_time: b.end_time,
  customer_name: b.customer_name,
  total_price: b.total_price,
  status: b.status,
  booking_type: b.booking_type,
  obs: b.observation ? b.observation.slice(0, 50) : ''
})));
