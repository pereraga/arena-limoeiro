const fs = require('fs');

async function checkCourtsInDB2() {
  const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
  const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

  const res = await fetch(`${db2Url}/rest/v1/courts?select=*`, {
    headers: { apikey: db2Key, Authorization: `Bearer ${db2Key}` }
  });
  if (res.ok) {
    const courts = await res.json();
    console.log(`Courts in DB2 (count: ${courts.length}):`);
    courts.forEach(c => console.log(`- [${c.id}] ${c.name} | Cat: ${c.category} | Price/h: ${c.base_price_per_hour}`));
  } else {
    console.log('Error:', res.status, await res.text());
  }
}

checkCourtsInDB2();
