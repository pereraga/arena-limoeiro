const fs = require('fs');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');

// Extract the script tag that contains getMatchesForDate
const scriptStart = adminHtml.indexOf('window.adminGameState =');
const scriptEnd = adminHtml.indexOf('window.selectMovementDay = function');

console.log('Script block from', scriptStart, 'to', scriptEnd);
const code = adminHtml.substring(scriptStart, scriptEnd);

const vm = require('vm');
const defaultData = fs.readFileSync('public/default-data.js', 'utf8');

const context = {
  window: {},
  document: {
    getElementById: () => null,
    querySelectorAll: () => []
  },
  console: console,
  localStorage: { getItem: () => null, setItem: () => null },
  fetch: () => Promise.resolve({ ok: false }),
  performance: { now: () => Date.now() },
  ADMIN_COURTS: [
    { id: 'court-society-1', name: 'SOCIETY - ARENA CENTRAL' },
    { id: 'court-futsal-1788963178368', name: 'FUT 5 - SOCCER 5' },
    { id: 'court-society-2', name: 'FUT 6 - SOCCER 6' },
    { id: 'court-beach-1', name: 'FUT 7 - SOCCER 7' }
  ],
  getCourtById: function(id) {
    return this.ADMIN_COURTS.find(c => c.id === id) || { id: id || 'court-society-1', name: 'Quadra Central' };
  }
};
context.window = context;

vm.createContext(context);
vm.runInContext(defaultData, context);

// Let's run getLoadedBookings and getLoadedMonthly and getMatchesForDate
const testCode = `
  ${adminHtml.substring(adminHtml.indexOf('function getLoadedBookings()'), adminHtml.indexOf('window.selectMovementDay = function'))}
`;

try {
  vm.runInContext(testCode, context);
  const matches = context.getMatchesForDate('2026-11-03');
  console.log(`\n========================================`);
  console.log(`RESULTS FOR 2026-11-03 (Terça-feira):`);
  console.log(`Total Matches Returned: ${matches.length}`);
  let totalRev = 0;
  matches.forEach((m, i) => {
    totalRev += m.total_price;
    console.log(`  #${i+1}: [${m.start_time} - ${m.end_time}] ${m.customer_name} | Court: ${m.court_name || m.court_id} | R$ ${m.total_price}`);
  });
  console.log(`Total Projected Revenue: R$ ${totalRev.toFixed(2)}`);
  console.log(`========================================\n`);

  if (matches.length === 5 && totalRev === 2400) {
    console.log('✅ 100% SUCCESS: Exactly 5 games identified and counted, total R$ 2400,00!');
  } else {
    console.log('❌ MISMATCH in matches or revenue');
  }
} catch(e) {
  console.error('Error running test:', e);
}
