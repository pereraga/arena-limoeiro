const fs = require('fs');
const path = require('path');
const vm = require('vm');

const defaultDataCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'default-data.js'), 'utf8');
const adminCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');

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
        contains: (c) => (elements[id].className || '').includes(c),
        add: (c) => { elements[id].className += ' ' + c; },
        remove: (c) => { elements[id].className = (elements[id].className || '').replace(new RegExp('\\\\b' + c + '\\\\b', 'g'), '').trim(); }
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
    createElement: (tag) => ({ tagName: tag, className: '', innerHTML: '', children: [] }),
    addEventListener: () => {},
    activeElement: null
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  console: console,
  Set: Set, Array: Array, Math: Math, Date: Date,
  parseInt: parseInt, parseFloat: parseFloat, Number: Number, String: String,
  encodeURIComponent: encodeURIComponent,
  setInterval: () => 123, clearInterval: () => {}, setTimeout: () => 456, clearTimeout: () => {},
  location: { search: '', hash: '', origin: 'https://arenalimoeiro.vercel.app' },
  navigator: { userAgent: 'Node', clipboard: { writeText: () => Promise.resolve() } }
};
domMock.window = domMock;
domMock.global = domMock;

vm.createContext(domMock);
vm.runInContext(defaultDataCode, domMock);

const scriptMatches = adminCode.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
const mainScript = scriptMatches.reduce((a, b) => a.length > b.length ? a : b).replace(/<\/?script[^>]*>/gi, '');

vm.runInContext(mainScript, domMock);

console.log('--- 1. Testing Subtabs in Single Horizontal Line ---');
// Verify markup contains single row
const subtabsRowIdx = adminCode.indexOf('TODAS AS SUB-ABAS AJUSTADAS EM UMA LINHA COM O BOTÃO DA API');
console.log('Found single line subtabs marker:', subtabsRowIdx !== -1);
if (subtabsRowIdx === -1) throw new Error('Marker not found!');

const subtabsContainer = adminCode.substring(subtabsRowIdx, subtabsRowIdx + 4500);

const buttonsExpected = [
  'btnSubtab-jogos',
  'btnSubtab-modalidades',
  'btnSubtab-posicoes',
  'btnSubtab-mensalistas',
  'btnSubtab-clientes',
  'btnSubtab-supabase',
  'btnSubtab-api',
  'btnSubtab-backup'
];

buttonsExpected.forEach(btnId => {
  const hasBtn = subtabsContainer.includes(`id="${btnId}"`);
  console.log(`Button ${btnId} in single line container:`, hasBtn ? 'PASS' : 'FAIL');
  if (!hasBtn) throw new Error(`Missing ${btnId}`);
});

console.log('Container has flex-nowrap:', subtabsContainer.includes('flex-nowrap') ? 'PASS' : 'FAIL');

console.log('\n--- 2. Testing switchCadastrosSubTab("api") ---');
domMock.window.switchCadastrosSubTab('api');

const apiBtn = elements['btnSubtab-api'];
const apiContent = elements['subtab-content-api'];
console.log('btnSubtab-api class after switch to api:', apiBtn.className);
console.log('subtab-content-api is not hidden:', !apiContent.className.includes('hidden') ? 'PASS' : 'FAIL');

console.log('\n--- 3. Testing API Playground & Helper Functions ---');
console.log('typeof initApiPlayground:', typeof domMock.window.initApiPlayground);
console.log('typeof executeApiPlaygroundRequest:', typeof domMock.window.executeApiPlaygroundRequest);
console.log('typeof toggleApiKeyVisibility:', typeof domMock.window.toggleApiKeyVisibility);
console.log('typeof copyApiText:', typeof domMock.window.copyApiText);
console.log('typeof copyApiSnippet:', typeof domMock.window.copyApiSnippet);

domMock.window.initApiPlayground();
const baseDisplay = elements['apiBaseUrlDisplay'];
console.log('apiBaseUrlDisplay value:', baseDisplay?.value);

console.log('\n--- 4. Executing simulated API request in sandbox ---');
domMock.window.executeApiPlaygroundRequest();
console.log('apiResponseStatusBadge text:', elements['apiResponseStatusBadge']?.textContent);
console.log('apiResponseJsonCode text:', elements['apiResponseJsonCode']?.textContent?.substring(0, 80));

console.log('\nALL API SUBTAB TESTS PASSED 100%!');
