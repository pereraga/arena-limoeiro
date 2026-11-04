const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'default-data.js'), 'utf8');
const sandbox = { window: {} };
const fn = new Function('window', content);
fn(sandbox.window);

const bookings = sandbox.window.ARENA_DEFAULT_DATA.initialBookings || [];
console.log('Total bookings in default-data:', bookings.length);

const nov2 = bookings.filter(b => b.date === '2026-11-02');
console.log('Bookings on 2026-11-02:', nov2.length, nov2.map(b => ({ id: b.id, name: b.customer_name, time: b.time || b.start_time, court: b.court_id })));

const nov3 = bookings.filter(b => b.date === '2026-11-03');
console.log('Bookings on 2026-11-03:', nov3.length, nov3.map(b => ({ id: b.id, name: b.customer_name, time: b.time || b.start_time, court: b.court_id })));
