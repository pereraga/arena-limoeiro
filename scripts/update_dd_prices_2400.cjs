const fs = require('fs');

const path = 'public/default-data.js';
let content = fs.readFileSync(path, 'utf8');

// Replace Aline on 2026-11-03 price from 150 to 400
content = content.replace(
  /("date":\s*"2026-11-03"[\s\S]*?"customer_name":\s*"Aline"[\s\S]*?"total_price":\s*)150/,
  '$1400'
);

// Replace Genilson on 2026-11-03 price from 140 to 600
content = content.replace(
  /("date":\s*"2026-11-03"[\s\S]*?"customer_name":\s*"Genilson"[\s\S]*?"total_price":\s*)140/,
  '$1600'
);

// Replace Zé Luiz on 2026-11-03 price from 160 to 500
content = content.replace(
  /("date":\s*"2026-11-03"[\s\S]*?"customer_name":\s*"Zé Luiz"[\s\S]*?"total_price":\s*)160/,
  '$1500'
);

fs.writeFileSync(path, content, 'utf8');
console.log('✓ Updated initialBookings prices for 2026-11-03 to sum R$ 2400');
