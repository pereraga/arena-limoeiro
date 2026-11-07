const fs = require('fs');
const html = fs.readFileSync('public/admin.html', 'utf8');

// Find autoCalculateDirectBookingPrice
const idx = html.indexOf('autoCalculateDirectBookingPrice');
console.log('First occurrence at:', idx);
// Find the function definition
const funcIdx = html.indexOf('function autoCalculateDirectBookingPrice', idx);
console.log('Function def at:', funcIdx);

// Also check onDirectBookingDropdownChange
const dropdownIdx = html.indexOf('onDirectBookingDropdownChange');
console.log('onDirectBookingDropdownChange first at:', dropdownIdx);
const dropdownFunc = html.indexOf('function onDirectBookingDropdownChange', dropdownIdx);
console.log('Function def at:', dropdownFunc);
if (dropdownFunc > 0) {
  const end2 = html.indexOf('\n  };', dropdownFunc) + 4;
  console.log(html.substring(dropdownFunc, Math.min(end2, dropdownFunc + 1500)));
}
