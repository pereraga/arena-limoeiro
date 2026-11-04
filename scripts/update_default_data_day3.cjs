const fs = require('fs');

let content = fs.readFileSync('public/default-data.js', 'utf8');

// Replace status: 'confirmed' on the day 3 bookings
content = content.replace(
  /id:\s*['"]booking-20261103-ariadnes['"][\s\S]*?status:\s*['"]confirmed['"]/g,
  (m) => m.replace("status: 'confirmed'", "status: 'finished'")
);
content = content.replace(
  /id:\s*['"]booking-20261103-esc-ariadnes['"][\s\S]*?status:\s*['"]confirmed['"]/g,
  (m) => m.replace("status: 'confirmed'", "status: 'finished'")
);
content = content.replace(
  /id:\s*['"]booking-20261103-aline['"][\s\S]*?status:\s*['"]confirmed['"]/g,
  (m) => m.replace("status: 'confirmed'", "status: 'finished'")
);
content = content.replace(
  /id:\s*['"]booking-20261103-genilson['"][\s\S]*?status:\s*['"]confirmed['"]/g,
  (m) => m.replace("status: 'confirmed'", "status: 'finished'")
);
content = content.replace(
  /id:\s*['"]booking-20261103-zeluiz['"][\s\S]*?status:\s*['"]confirmed['"]/g,
  (m) => m.replace("status: 'confirmed'", "status: 'finished'")
);

fs.writeFileSync('public/default-data.js', content, 'utf8');
console.log('✓ Successfully updated default-data.js 03/11 bookings to status: finished');
