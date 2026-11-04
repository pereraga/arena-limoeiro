const fs = require('fs');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');
const match = adminHtml.match(/const ARENA_CLOUD_DBS = (\{[\s\S]*?\});/);
if (!match) {
  console.error('ARENA_CLOUD_DBS not found');
  process.exit(1);
}
const config = eval('(' + match[1] + ')');

async function updateDb(url, key, dbName) {
  console.log(`\n--- UPDATING ${dbName} (bookings date <= 2026-11-03 to finished) ---`);
  
  // 1. Fetch current non-finished bookings for date <= 2026-11-03
  const fetchUrl = `${url}/rest/v1/bookings?date=lte.2026-11-03&status=neq.finished&select=id,customer_name,date,start_time,status`;
  const res = await fetch(fetchUrl, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  
  if (!res.ok) {
    console.error(`Error querying ${dbName}:`, res.status, await res.text());
    return;
  }
  
  const pending = await res.json();
  console.log(`${dbName}: Found ${pending.length} bookings needing finalization <= 2026-11-03:`);
  pending.forEach(b => console.log(`  - [${b.date}] ${b.start_time} ${b.customer_name} (current: ${b.status})`));
  
  if (pending.length === 0) {
    console.log(`✓ All bookings in ${dbName} <= 2026-11-03 are already finished!`);
    return;
  }

  // 2. Update via PATCH
  const patchUrl = `${url}/rest/v1/bookings?date=lte.2026-11-03&status=neq.finished`;
  const patchRes = await fetch(patchUrl, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      status: 'finished'
    })
  });

  if (patchRes.ok) {
    const updated = await patchRes.json();
    console.log(`✓ Successfully updated ${updated.length} bookings in ${dbName} to 'finished'!`);
  } else {
    console.error(`Failed to update ${dbName}:`, patchRes.status, await patchRes.text());
  }
}

async function run() {
  await updateDb(config.db2Url, config.db2Key, 'DB2 (Primary)');
  await updateDb(config.db1Url, config.db1Key, 'DB1 (Secondary)');
}

run();
