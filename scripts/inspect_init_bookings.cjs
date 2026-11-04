const fs = require('fs');

const content = fs.readFileSync('public/default-data.js', 'utf8');

const vm = require('vm');
const context = { window: {} };
context.window = context;
vm.createContext(context);
vm.runInContext(content, context);

const initBookings = context.window.ARENA_DEFAULT_DATA.initialBookings || [];
console.log(`Total initialBookings: ${initBookings.length}`);
const pastNonFinished = initBookings.filter(b => b.date <= '2026-11-03' && b.status !== 'finished');
console.log(`Past non-finished initialBookings <= 2026-11-03: ${pastNonFinished.length}`);
pastNonFinished.forEach(b => console.log(`  [${b.date}] ${b.customer_name} | status: ${b.status}`));
