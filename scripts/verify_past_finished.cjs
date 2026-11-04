const fs = require('fs');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');
const match = adminHtml.match(/const ARENA_CLOUD_DBS = (\{[\s\S]*?\});/);
const config = eval('(' + match[1] + ')');

async function verifyAllPastFinished() {
  for (const dbInfo of [
    { name: 'DB2', url: config.db2Url, key: config.db2Key },
    { name: 'DB1', url: config.db1Url, key: config.db1Key }
  ]) {
    const res = await fetch(`${dbInfo.url}/rest/v1/bookings?date=lte.2026-11-03&status=neq.finished&select=id,customer_name,date,status`, {
      headers: { apikey: dbInfo.key, Authorization: `Bearer ${dbInfo.key}` }
    });
    if (res.ok) {
      const pending = await res.json();
      console.log(`${dbInfo.name}: Non-finished bookings <= 2026-11-03: count = ${pending.length}`);
      pending.forEach(b => console.log(`  - [${b.date}] ${b.customer_name} (status: ${b.status})`));
    } else {
      console.error(`Error querying ${dbInfo.name}:`, res.status, await res.text());
    }
  }
}

verifyAllPastFinished();
