const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');

// Extract initialMonthlyMembers
const m = content.match(/initialMonthlyMembers\s*=\s*(\[[\s\S]*?\]);/);
if (m) {
  try {
    const arr = eval(m[1]);
    const terca = arr.filter(x => (x.day_of_week || '').toLowerCase().includes('terca'));
    console.log('Monthly members on terca:', terca.map(x => ({ id: x.id, name: x.team_name, court: x.court_id, time: x.time || x.start_time })));
  } catch(e) {
    console.error('Eval error:', e);
  }
} else {
  console.log('initialMonthlyMembers not matched with regex');
}
