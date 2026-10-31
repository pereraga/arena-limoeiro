const fs = require('fs');
const content = fs.readFileSync('public/index-sistema2.html', 'utf8');

const heroIdx = content.indexOf('class="hero"');
const bookingIdx = content.indexOf('class="booking-wrap"');
const formIdx = content.indexOf('id="booking-form"');
const spaceIdx = content.indexOf('id="space-grid"');

console.log({ heroIdx, bookingIdx, formIdx, spaceIdx });
if (bookingIdx !== -1) {
  console.log(content.slice(bookingIdx, bookingIdx + 2000));
}
