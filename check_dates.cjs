const fs = require('fs');

const d = fs.readFileSync('public/default-data.js', 'utf8');
const window = {};
eval(d);

const bookings = window.ARENA_DEFAULT_DATA.bookings || [];
const dates = [...new Set(bookings.map(b => b.date))];
console.log('Total bookings:', bookings.length);
console.log('Sample dates:', dates.slice(0, 15));

const ariadnes = bookings.filter(b => (b.customer_name || '').includes('Ariadnes'));
console.log('Ariadnes bookings:', ariadnes.slice(0, 5).map(b => ({
  id: b.id,
  date: b.date,
  court_id: b.court_id,
  start_time: b.start_time,
  end_time: b.end_time,
  price: b.total_price,
  status: b.status,
  obs: b.observation ? b.observation.slice(0, 50) : ''
})));
