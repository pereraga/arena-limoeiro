const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load default-data.js
const defaultDataCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'default-data.js'), 'utf8');
const adminCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');

// Mock a lightweight browser environment
const domMock = {
  window: {},
  document: {
    getElementById: (id) => null,
    querySelector: (sel) => null,
    querySelectorAll: (sel) => [],
    addEventListener: () => {},
    activeElement: null
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  console: console,
  Set: Set,
  Array: Array,
  Math: Math,
  Date: Date,
  parseInt: parseInt,
  parseFloat: parseFloat,
  Number: Number,
  String: String,
  encodeURIComponent: encodeURIComponent,
  setInterval: () => 123,
  clearInterval: () => {},
  setTimeout: () => 456,
  clearTimeout: () => {},
  location: { search: '', hash: '' },
  navigator: { userAgent: 'Node' }
};
domMock.window = domMock;
domMock.global = domMock;

vm.createContext(domMock);
vm.runInContext(defaultDataCode, domMock);

// Find and run renderMatchCardHtml definition in context
const scriptMatches = adminCode.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
const mainScript = scriptMatches.reduce((a, b) => a.length > b.length ? a : b).replace(/<\/?script[^>]*>/gi, '');

vm.runInContext(mainScript, domMock);

console.log('Testing renderMatchCardHtml in sandbox...');
console.log('typeof window.renderMatchCardHtml:', typeof domMock.window.renderMatchCardHtml);

// Get matches for 2026-11-04
const day4Matches = domMock.window.getMatchesForDate('2026-11-04');
console.log('Day 04 matches count:', day4Matches.length);

day4Matches.forEach((m, idx) => {
  const html = domMock.window.renderMatchCardHtml(m, idx === 0);
  console.log(`\n--- Match #${idx + 1}: ${m.customer_name || m.name} (ID: ${m.id}) ---`);
  console.log('Card HTML length:', html.length);
  
  // Verify key components
  const hasTimebox = html.includes('Horário Reservado') && html.includes(m.start_time || m.start || '15:00');
  const hasClient = html.includes(m.customer_name || m.name);
  const hasWhatsapp = html.includes('fa-brands fa-whatsapp');
  const hasToggle = html.includes(`toggleDetails('${m.id}')`) && html.includes(`arrow-details-${m.id}`);
  const hasDetailsPanel = html.includes(`id="details-${m.id}"`);
  const hasDelayBlock = html.includes(`id="input-delay-h-${m.id}"`) && html.includes(`quickAddAtrasoCard('${m.id}', 15)`);
  const hasExtraBlock = html.includes(`id="input-extra-h-${m.id}"`) && html.includes(`quickAddExtraCard('${m.id}', 30)`);
  const hasOriginSelect = html.includes(`id="select-origin-${m.id}"`);
  const hasCalcBlock = html.includes(`id="status-calc-total-${m.id}"`);
  const hasActionButtons = html.includes(`openEditGame('${m.id}')`) && html.includes(`openContract('${m.id}')`);
  const hasTimeline = html.includes(`id="timeline-container-${m.id}"`) && html.includes(`addCardTimelineNote('${m.id}')`);

  console.log('  Timebox:', hasTimebox ? 'PASS' : 'FAIL');
  console.log('  Client Name:', hasClient ? 'PASS' : 'FAIL');
  console.log('  WhatsApp Link & Icon:', hasWhatsapp ? 'PASS' : 'FAIL');
  console.log('  Details Toggle Button:', hasToggle ? 'PASS' : 'FAIL');
  console.log('  Details Panel:', hasDetailsPanel ? 'PASS' : 'FAIL');
  console.log('  Delay Block (+15m/+30m):', hasDelayBlock ? 'PASS' : 'FAIL');
  console.log('  Extra Block (+30m/+1h):', hasExtraBlock ? 'PASS' : 'FAIL');
  console.log('  Origin Select:', hasOriginSelect ? 'PASS' : 'FAIL');
  console.log('  Calc Block:', hasCalcBlock ? 'PASS' : 'FAIL');
  console.log('  Action Buttons:', hasActionButtons ? 'PASS' : 'FAIL');
  console.log('  Timeline & Add Note:', hasTimeline ? 'PASS' : 'FAIL');

  if (!hasTimebox || !hasClient || !hasWhatsapp || !hasToggle || !hasDetailsPanel || !hasDelayBlock || !hasExtraBlock || !hasOriginSelect || !hasCalcBlock || !hasActionButtons || !hasTimeline) {
    console.error('Validation FAILED for match', m.id);
    process.exit(1);
  }
});

console.log('\nALL 5 MATCHES FOR DAY 04 RENDERED PERFECTLY WITH 100% PASS!');
