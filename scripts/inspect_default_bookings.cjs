const fs = require('fs');

const content = fs.readFileSync('public/default-data.js', 'utf8');

const vm = require('vm');
const context = { window: {} };
context.window = context;
vm.createContext(context);
vm.runInContext(content, context);

const bookings = context.DEFAULT_BOOKINGS || (context.window.ARENA_DEFAULT_DATA && context.window.ARENA_DEFAULT_DATA.bookings) || [];
console.log(`Total DEFAULT_BOOKINGS: ${bookings.length}`);
const pastNonFinished = bookings.filter(b => b.date <= '2026-11-03' && b.status !== 'finished');
console.log(`Past non-finished bookings <= 2026-11-03: ${pastNonFinished.length}`);
pastNonFinished.forEach(b => console.log(`  [${b.date}] ${b.customer_name} | status: ${b.status}`));
