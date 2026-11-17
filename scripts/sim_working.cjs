const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const defData = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/default-data.js', 'utf8');

const courtsIdx = code.indexOf('const ADMIN_COURTS = [');
const courtsEnd = code.indexOf('];', courtsIdx) + 2;

const getCourtCode = code.substring(360239, 360239 + 1681);
const getMatchesCode = code.substring(386270, 386270 + 8568);

const vm = require('vm');
const context = {
  window: {},
  document: { getElementById: () => null, querySelectorAll: () => [] },
  console: console,
  Set: Set,
  Map: Map,
  Date: Date,
  Math: Math,
  parseFloat: parseFloat,
  Number: Number,
  String: String,
  Array: Array,
  Boolean: Boolean
};
context.window = context;

vm.createContext(context);
vm.runInContext(defData, context);
vm.runInContext(code.substring(courtsIdx, courtsEnd), context);
vm.runInContext(getCourtCode, context);
vm.runInContext(getMatchesCode, context);

context.adminGameState = {
  selectedDate: '2026-11-17',
  monthlyMembers: context.DEFAULT_MONTHLY_MEMBERS || [],
  bookings: [
    {
      id: 'ARENA-B1950',
      court_id: 'court-beach-1',
      date: '2026-11-17',
      start_time: '18:30',
      end_time: '20:30',
      time: '18:30 às 20:30',
      duration: 120,
      customer_name: 'Thiago',
      customer_phone: '81998747021',
      total_price: 220,
      status: 'confirmed',
      booking_type: 'avulso'
    }
  ]
};

const matches = vm.runInContext("getMatchesForDate('2026-11-17')", context);
console.log('Total matches returned for 2026-11-17:', matches.length);
matches.forEach(m => {
  console.log(`- [${m.id}] ${m.customer_name} | Court: ${m.court_name} (${m.court_id}) | Time: ${m.time} | Type: ${m.booking_type} | Status: ${m.status}`);
});
