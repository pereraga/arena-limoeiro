const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

// Let's extract the bookings array, monthly array, and getMatchesForDate implementation
const startIdx = content.indexOf('const adminGameState = {');
const endIdx = content.indexOf('window.selectMovementDay = function');

console.log('Found block between', startIdx, endIdx);
const subCode = content.substring(startIdx, endIdx);
// Let's run it in a sandbox or test environment
const vm = require('vm');
const sandbox = {
  window: {},
  document: { getElementById: () => null },
  console: console,
  ARENA_CLOUD_DBS: { db1Url: '', db2Url: '' },
  localStorage: { getItem: () => null, setItem: () => null }
};
vm.createContext(sandbox);

// Let's inspect getMatchesForDate directly from the code
console.log('--- Checking getMatchesForDate code ---');
const gmfIdx = content.indexOf('function getMatchesForDate(dateStr)');
console.log(content.substring(gmfIdx, gmfIdx + 2000));
