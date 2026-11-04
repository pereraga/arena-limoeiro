function parseTimeToMinutes(t) {
  if (!t) return 0;
  const parts = t.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
}

function formatMinutesToTime(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
}

const occupiedRanges = [
  { start: parseTimeToMinutes('15:30'), end: parseTimeToMinutes('16:30'), desc: 'Monica' },
  { start: parseTimeToMinutes('18:00'), end: parseTimeToMinutes('20:00'), desc: 'Aline' },
  { start: parseTimeToMinutes('20:00'), end: parseTimeToMinutes('22:00'), desc: 'Jajá' }
];

console.log('Occupied ranges:', occupiedRanges);

// Find first free 1h slot starting from 11:30
let firstFree = null;
for (let m = parseTimeToMinutes('11:30'); m <= 22 * 60; m += 30) {
  const end = m + 60;
  const conflict = occupiedRanges.find(r => Math.max(m, r.start) < Math.min(end, r.end));
  if (!conflict) {
    firstFree = { start: formatMinutesToTime(m), end: formatMinutesToTime(end) };
    break;
  }
}

console.log('First free 1h slot:', firstFree);

// Test selection starting at 16:30
const clickStart = parseTimeToMinutes('16:30');
const nextOccupied = occupiedRanges.find(r => r.start >= clickStart);
console.log('Next occupied after 16:30:', nextOccupied);
const maxEnd = nextOccupied ? nextOccupied.start : (23 * 60);
console.log('Max available end for 16:30:', formatMinutesToTime(maxEnd));
