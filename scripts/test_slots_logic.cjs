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

const slots = [];
for (let m = 6 * 60; m <= 23 * 60; m += 30) {
  slots.push(formatMinutesToTime(m));
}

console.log('Total slots generated (30 min):', slots.length);
console.log('Sample slots:', slots.slice(0, 10));
console.log('End slots:', slots.slice(-5));
