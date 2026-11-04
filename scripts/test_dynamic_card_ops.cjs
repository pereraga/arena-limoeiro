const fs = require('fs');
const path = require('path');
const vm = require('vm');

const defaultDataCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'default-data.js'), 'utf8');
const adminCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');

// Element storage
const elements = {};
function getOrCreateEl(id) {
  if (!elements[id]) {
    elements[id] = {
      id: id,
      value: '',
      textContent: '',
      className: '',
      innerHTML: '',
      style: { display: '' },
      classList: {
        contains: (c) => false,
        add: (c) => {},
        remove: (c) => {}
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      appendChild: (child) => {
        if (!elements[id].children) elements[id].children = [];
        elements[id].children.push(child);
      }
    };
  }
  return elements[id];
}

const domMock = {
  window: {},
  document: {
    getElementById: (id) => getOrCreateEl(id),
    querySelector: (sel) => null,
    querySelectorAll: (sel) => [],
    createElement: (tag) => ({
      tagName: tag,
      className: '',
      innerHTML: '',
      children: []
    }),
    addEventListener: () => {},
    activeElement: null
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  console: console,
  Set: Set, Array: Array, Math: Math, Date: Date,
  parseInt: parseInt, parseFloat: parseFloat, Number: Number, String: String,
  encodeURIComponent: encodeURIComponent,
  setInterval: () => 123, clearInterval: () => {}, setTimeout: () => 456, clearTimeout: () => {},
  location: { search: '', hash: '' },
  navigator: { userAgent: 'Node' }
};
domMock.window = domMock;
domMock.global = domMock;

vm.createContext(domMock);
vm.runInContext(defaultDataCode, domMock);

const scriptMatches = adminCode.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
const mainScript = scriptMatches.reduce((a, b) => a.length > b.length ? a : b).replace(/<\/?script[^>]*>/gi, '');

vm.runInContext(mainScript, domMock);

console.log('Testing dynamic card operations...');
const testMatchId = 'monthly-mensal-1792434474139'; // Davi (15:00 - 19:00, R$ 600)
const matchObj = domMock.window.getGame(testMatchId);
console.log('Test match found:', matchObj.customer_name, 'Base Price:', matchObj.total_price);

// 1. Test Quick Add Delay +15m
console.log('\n--- 1. Testing quickAddAtrasoCard(+15m) ---');
domMock.window.quickAddAtrasoCard(testMatchId, 15);
console.log('matchObj.late after +15m:', matchObj.late);
console.log('status-delay text:', elements['status-delay-' + testMatchId]?.textContent);
if (matchObj.late !== 15) throw new Error('Expected late to be 15');

// 2. Test Quick Add Delay +30m (total 45m)
console.log('\n--- 2. Testing quickAddAtrasoCard(+30m) ---');
domMock.window.quickAddAtrasoCard(testMatchId, 30);
console.log('matchObj.late after +30m:', matchObj.late);
if (matchObj.late !== 45) throw new Error('Expected late to be 45');

// 3. Test Quick Add Extra +30m
console.log('\n--- 3. Testing quickAddExtraCard(+30m) ---');
domMock.window.quickAddExtraCard(testMatchId, 30);
console.log('matchObj.extraTime after +30m:', matchObj.extraTime);
console.log('badge-calc-status text:', elements['badge-calc-status-' + testMatchId]?.textContent);
console.log('status-calc-total text:', elements['status-calc-total-' + testMatchId]?.textContent);
console.log('mainPriceDisplay text:', elements['mainPriceDisplay-' + testMatchId]?.textContent);
if (matchObj.extraTime !== 30) throw new Error('Expected extraTime to be 30');
if (!elements['badge-calc-status-' + testMatchId]?.textContent.includes('Pendente Extra')) {
  throw new Error('Expected Pendente Extra badge');
}

// 4. Test Quick Add Extra +1h (total 90m)
console.log('\n--- 4. Testing quickAddExtraCard(+60m) ---');
domMock.window.quickAddExtraCard(testMatchId, 60);
console.log('matchObj.extraTime after +60m:', matchObj.extraTime);
if (matchObj.extraTime !== 90) throw new Error('Expected extraTime to be 90');

// 5. Test Change Origin
console.log('\n--- 5. Testing onGameOriginChange ---');
domMock.window.onGameOriginChange(testMatchId, 'WhatsApp Oficial');
console.log('matchObj.booking_origin:', matchObj.booking_origin);
if (matchObj.booking_origin !== 'WhatsApp Oficial') throw new Error('Expected origin to be WhatsApp Oficial');

// 6. Test Add Timeline Note
console.log('\n--- 6. Testing addCardTimelineNote ---');
const noteInput = getOrCreateEl('internal-note-input-' + testMatchId);
noteInput.value = 'Cliente solicitou 2 bolas society e coletes amarelos';
domMock.window.addCardTimelineNote(testMatchId);
const lastLog = matchObj.log[matchObj.log.length - 1];
console.log('Last log in match:', lastLog);
if (!lastLog.text.includes('Cliente solicitou 2 bolas')) throw new Error('Expected note in log');

console.log('\nALL DYNAMIC CARD OPERATIONS TESTED AND PASSED 100%!');
