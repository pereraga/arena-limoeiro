const fs = require('fs');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');
const match = adminHtml.match(/const ARENA_CLOUD_DBS = (\{[\s\S]*?\});/);
const config = eval('(' + match[1] + ')');

async function inspectDay04Details() {
  const res = await fetch(`${config.db2Url}/rest/v1/bookings?date=eq.2026-11-04&select=*`, {
    headers: { apikey: config.db2Key, Authorization: `Bearer ${config.db2Key}` }
  });
  if (res.ok) {
    const list = await res.json();
    console.log(`Total 04/11 records in DB2: ${list.length}`);
    list.forEach(b => {
      console.log(`ID: ${b.id} | Name: ${b.customer_name} | Court: ${b.court_id} | Time: ${b.start_time}-${b.end_time} | Status: ${b.status} | Type: ${b.booking_type} | Payment: ${b.payment_method} | Created: ${b.created_at}`);
    });
  }
}

inspectDay04Details();
