const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

const sIdx = content.indexOf('function renderMovementMatches() {');
const eIdx = content.indexOf('window.renderMovementMatches = renderMovementMatches;');

const funcBody = content.substring(sIdx, eIdx + 60);

// Let's create a test environment that mocks DOM and runs renderMovementMatches
const script = `
const window = {
  adminGameState: {
    selectedDate: '2026-11-09',
    movementFilterCourt: 'all',
    movementFilterStatus: 'all',
    bookings: [],
    monthlyMembers: [
      { id: '1', name: 'Davi', day_of_week: 'segunda', start_time: '15:00', end_time: '19:00', court_id: 'fut7', status: 'active', monthly_price: 280 }
    ],
    courts: [
      { id: 'fut7', name: 'Campo Society 01', type: 'society' }
    ]
  },
  __matchesCacheByDate: new Map(),
  getSystemToday: () => '2026-11-09',
  checkIsMatchLive: () => false,
  formatDisplayDate: (d) => d
};

const document = {
  getElementById: (id) => {
    console.log('[DOM] getElementById:', id);
    if (id === 'movementMatchesListContainer') {
      return {
        querySelectorAll: () => [],
        innerHTML: ''
      };
    }
    if (id === 'movementFeedTitle') return { innerHTML: '', textContent: '' };
    if (id === 'movementFeedCount') return { textContent: '' };
    return null;
  },
  querySelector: () => null
};

function formatDisplayDate(d) { return d; }
function getCourtById(id) { return { id: id || 'fut7', name: 'Campo Society 01' }; }

// We need getMatchesForDate as well
${content.substring(content.indexOf('function getMatchesForDate(dateStr) {'), content.indexOf('function getMatchesForDate(dateStr) {') + 3000)}

// Now let's run funcBody
try {
  ${funcBody}
  console.log('Running renderMovementMatches()...');
  renderMovementMatches();
  console.log('renderMovementMatches executed without crash!');
} catch (e) {
  console.error('CRASH in renderMovementMatches:', e);
}
`;

fs.writeFileSync(path.join(__dirname, 'test_mock_render.cjs'), script);
