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

console.log('DEFAULT_MONTHLY_MEMBERS count:', context.DEFAULT_MONTHLY_MEMBERS.length);
context.DEFAULT_MONTHLY_MEMBERS.forEach(m => {
  console.log(`Member: ${m.team_name || m.responsible_name} | Day: ${m.day_of_week} | Time: ${m.time} | Court: ${m.court_id}`);
});
