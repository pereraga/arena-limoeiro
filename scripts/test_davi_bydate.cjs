const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'default-data.js'), 'utf8');
const sandbox = { window: {} };
const fn = new Function('window', content);
fn(sandbox.window);

const bookings = sandbox.window.ARENA_DEFAULT_DATA.initialBookings || [];
const davi = bookings.filter(b => (b.customer_name || '').toLowerCase() === 'davi' || (b.customer_name || '').toLowerCase() === 'davison');
console.log('Total Davi/Davison bookings in initialBookings:', davi.length);

const byDate = {};
davi.forEach(b => {
  byDate[b.date] = (byDate[b.date] || 0) + 1;
});
console.log('Davi bookings by date:', Object.keys(byDate).sort().slice(0, 20).map(d => `${d}: ${byDate[d]}`));
