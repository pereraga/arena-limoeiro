const fs = require('fs');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');
const match = adminHtml.match(/const ARENA_CLOUD_DBS = (\{[\s\S]*?\});/);
const config = eval('(' + match[1] + ')');

async function checkDay04() {
  console.log('=== CHECKING DB2 (Primary) FOR 2026-11-04 ===');
  const res2 = await fetch(`${config.db2Url}/rest/v1/bookings?date=eq.2026-11-04&select=id,customer_name,date,start_time,status`, {
    headers: { apikey: config.db2Key, Authorization: `Bearer ${config.db2Key}` }
  });
  if (res2.ok) {
    const b2 = await res2.json();
    console.log(`DB2 2026-11-04 count: ${b2.length}`);
    b2.forEach(b => console.log(`  [${b.date}] ${b.start_time} - ${b.customer_name} | status: ${b.status} | id: ${b.id}`));
  } else {
    console.log('DB2 error:', res2.status, await res2.text());
  }

  console.log('\n=== CHECKING DB1 (Secondary) FOR 2026-11-04 ===');
  const res1 = await fetch(`${config.db1Url}/rest/v1/bookings?date=eq.2026-11-04&select=id,customer_name,date,start_time,status`, {
    headers: { apikey: config.db1Key, Authorization: `Bearer ${config.db1Key}` }
  });
  if (res1.ok) {
    const b1 = await res1.json();
    console.log(`DB1 2026-11-04 count: ${b1.length}`);
    b1.forEach(b => console.log(`  [${b.date}] ${b.start_time} - ${b.customer_name} | status: ${b.status} | id: ${b.id}`));
  } else {
    console.log('DB1 error:', res1.status, await res1.text());
  }
}

checkDay04();
