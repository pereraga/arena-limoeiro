const fs = require('fs');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');
const match = adminHtml.match(/const ARENA_CLOUD_DBS = (\{[\s\S]*?\});/);
if (!match) {
  console.error('ARENA_CLOUD_DBS not found');
  process.exit(1);
}
const config = eval('(' + match[1] + ')');

async function run() {
  console.log('=== CHECKING BOOKINGS IN DB2 ===');
  const res2 = await fetch(`${config.db2Url}/rest/v1/bookings?select=*&order=date.asc`, {
    headers: { apikey: config.db2Key, Authorization: `Bearer ${config.db2Key}` }
  });
  if (res2.ok) {
    const bookings2 = await res2.json();
    console.log(`DB2 total bookings: ${bookings2.length}`);
    const past = bookings2.filter(b => b.date <= '2026-11-03');
    console.log(`DB2 past bookings (<= 2026-11-03): ${past.length}`);
    past.forEach(b => {
      console.log(`  [${b.date}] ${b.time || b.start_time} - ${b.customer_name} | status: ${b.status}`);
    });
  } else {
    console.log('DB2 error:', res2.status, await res2.text());
  }

  console.log('\n=== CHECKING BOOKINGS IN DB1 ===');
  const res1 = await fetch(`${config.db1Url}/rest/v1/bookings?select=*&order=date.asc`, {
    headers: { apikey: config.db1Key, Authorization: `Bearer ${config.db1Key}` }
  });
  if (res1.ok) {
    const bookings1 = await res1.json();
    console.log(`DB1 total bookings: ${bookings1.length}`);
    const past1 = bookings1.filter(b => b.date <= '2026-11-03');
    console.log(`DB1 past bookings (<= 2026-11-03): ${past1.length}`);
    past1.forEach(b => {
      console.log(`  [${b.date}] ${b.time || b.start_time} - ${b.customer_name} | status: ${b.status}`);
    });
  } else {
    console.log('DB1 error:', res1.status, await res1.text());
  }
}

run();
