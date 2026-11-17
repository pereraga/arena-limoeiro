const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const defData = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/default-data.js', 'utf8');

// Find ADMIN_COURTS
const courtsIdx = code.indexOf('const ADMIN_COURTS = [');
const courtsEnd = code.indexOf('];', courtsIdx) + 2;
console.log('ADMIN_COURTS found:', courtsIdx, courtsEnd);

// Find getCourtById
const getCourtIdx = code.indexOf('function getCourtById(cId)');
const getCourtEnd = code.indexOf('window.getCourtById = getCourtById;', getCourtIdx) + 36;
console.log('getCourtById found:', getCourtIdx, getCourtEnd);

// Find getMatchesForDate
const fnIdx = code.indexOf('function getMatchesForDate(dateStr)');
const fnEnd = code.indexOf('window.getMatchesForDate = getMatchesForDate;', fnIdx) + 44;
console.log('getMatchesForDate found:', fnIdx, fnEnd);

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
vm.runInContext(code.substring(getCourtIdx, getCourtEnd), context);
vm.runInContext(code.substring(fnIdx, fnEnd), context);

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
