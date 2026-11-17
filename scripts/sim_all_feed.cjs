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
  monthlyMembers: [
    { id: '1792437535347', responsible_name: 'Esc Ariadnes', day_of_week: 'terca', start_time: '16:00', end_time: '18:00', court_id: 'court-society-1' },
    { id: '1793115878805', responsible_name: 'Ariadnes', day_of_week: 'terca', start_time: '16:00', end_time: '18:00', court_id: 'court-futsal-1788963178368' },
    { id: '1792439823965', responsible_name: 'Aline', day_of_week: 'terca', start_time: '18:30', end_time: '20:00', court_id: 'court-futsal-1788963178368' },
    { id: '1793143167053', responsible_name: 'Genilson', day_of_week: 'terca', start_time: '20:00', end_time: '21:30', court_id: 'court-society-2' }
  ],
  bookings: [
    {
      id: 'ARENA-B1950',
      name: 'Thiago',
      customer_name: 'Thiago',
      status: 'confirmed',
      court_id: 'court-beach-1',
      date: '2026-11-17',
      start_time: '18:30',
      end_time: '20:30',
      time: '18:30 às 20:30',
      type: 'avulso'
    },
    {
      id: 'ARENA-6871',
      name: 'Aline',
      customer_name: 'Aline',
      status: 'confirmed',
      court_id: 'court-futsal-1788963178368',
      date: '2026-11-17',
      start_time: '18:30',
      end_time: '20:00',
      time: '18:30 às 20:00',
      type: 'mensalista'
    }
  ]
};

const matches = vm.runInContext("getMatchesForDate('2026-11-17')", context);
console.log('Matches count:', matches.length);
matches.forEach(m => {
  console.log(`- [${m.id}] ${m.customer_name} | Court: ${m.court_name} (${m.court_id}) | Time: ${m.time} | Type: ${m.booking_type} | Status: ${m.status}`);
});
