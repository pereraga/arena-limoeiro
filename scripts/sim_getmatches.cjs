const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const code = fs.readFileSync(path, 'utf8');

const dateStr = '2026-11-17';

// Load default data
const defData = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/default-data.js', 'utf8');

// Simulate in Node
const vm = require('vm');
const context = {
  window: {},
  document: {
    getElementById: () => null,
    querySelectorAll: () => []
  },
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

// Extract getMatchesForDate from admin.html
const fnIdx = code.indexOf('function getMatchesForDate(');
const fnEnd = code.indexOf('window.getMatchesForDate = getMatchesForDate;', fnIdx);
const fnCode = code.substring(fnIdx, fnEnd + 50);

// Also extract getCourtById and ADMIN_COURTS
const courtsIdx = code.indexOf('const ADMIN_COURTS =');
const courtsEnd = code.indexOf('function getCourtById(', courtsIdx);
const getCourtEnd = code.indexOf('window.getCourtById = getCourtById;', courtsEnd);

vm.runInContext(code.substring(courtsIdx, courtsEnd), context);
vm.runInContext(code.substring(courtsEnd, getCourtEnd + 40), context);
vm.runInContext(fnCode, context);

// Now simulate context.adminGameState
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
console.log('Matches count:', matches.length);
console.log('Matches list:');
matches.forEach(m => {
  console.log({ id: m.id, name: m.customer_name, court: m.court_name, court_id: m.court_id, time: m.time, type: m.booking_type });
});
