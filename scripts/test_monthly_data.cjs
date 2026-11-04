const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'default-data.js'), 'utf8');

// The file sets window.ARENA_DEFAULT_DATA = { ... }
const sandbox = { window: {} };
const fn = new Function('window', content);
fn(sandbox.window);

const monthly = sandbox.window.ARENA_DEFAULT_DATA.initialMonthlyMembers || [];
console.log('Total monthly members in default-data:', monthly.length);

const tercaMembers = monthly.filter(m => (m.day_of_week || '').toLowerCase().includes('terca'));
console.log('Terca monthly members:', tercaMembers.map(m => ({ id: m.id, name: m.team_name, court: m.court_id, time: m.start_time || m.time })));

const daviMembers = monthly.filter(m => (m.team_name || '').toLowerCase().includes('davi'));
console.log('Davi monthly members:', daviMembers.map(m => ({ id: m.id, name: m.team_name, day: m.day_of_week, court: m.court_id, time: m.start_time || m.time })));
