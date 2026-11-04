const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'default-data.js'), 'utf8');
const sandbox = { window: {} };
const fn = new Function('window', content);
fn(sandbox.window);

const monthly = sandbox.window.ARENA_DEFAULT_DATA.initialMonthlyMembers || [];
const ze = monthly.filter(m => (m.team_name || '').toLowerCase().includes('luiz'));
console.log('Zé Luiz monthly records:', ze.map(m => ({ id: m.id, name: m.team_name, day: m.day_of_week, court: m.court_id, time: m.start_time || m.time })));
