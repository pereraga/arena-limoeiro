const fs = require('fs');
const html = fs.readFileSync('public/admin.html', 'utf8');

// Extract all option values from directBookingEnd
const selectStart = html.indexOf('<select id="directBookingEnd"');
const selectEnd = html.indexOf('</select>', selectStart) + 9;
const selectHTML = html.substring(selectStart, selectEnd);

const optionMatches = Array.from(selectHTML.matchAll(/value="([^"]+)"/g));
const options = optionMatches.map(function(m) { return m[1]; });
console.log('DirectBookingEnd options:', options.join(', '));
console.log('Total options:', options.length);

// What times does the grid generate? 06:00 to 23:00 step 30min
const gridTimes = [];
for (let m = 6*60; m <= 23*60; m += 30) {
  const h = String(Math.floor(m/60)).padStart(2,'0');
  const min = String(m%60).padStart(2,'0');
  gridTimes.push(h + ':' + min);
}

// Which grid times are NOT in endSelect options?
const missing = gridTimes.filter(function(t) { return options.indexOf(t) === -1; });
console.log('Grid times missing from endSelect:', missing.join(', ') || 'NONE - all present');
