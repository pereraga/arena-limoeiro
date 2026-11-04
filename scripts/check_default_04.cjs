const fs = require('fs');

const content = fs.readFileSync('public/default-data.js', 'utf8');
const vm = require('vm');
const ctx = { window: {} };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(content, ctx);

const b04 = (ctx.window.ARENA_DEFAULT_DATA.initialBookings || []).filter(b => b.date === '2026-11-04');
console.log('default-data.js 04/11 bookings count:', b04.length);
b04.forEach(b => console.log(`  [${b.start_time}] ${b.customer_name} | status: ${b.status} | id: ${b.id}`));
