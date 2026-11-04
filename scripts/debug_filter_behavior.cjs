const fs = require('fs');
const https = require('https');

function fetchDB2(endpoint) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'aukrcnhuyultkjqsgvea.supabase.co',
      path: endpoint,
      method: 'GET',
      headers: {
        'apikey': 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi',
        'Authorization': 'Bearer sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function debugFilter() {
  const bookings = await fetchDB2('/rest/v1/bookings?select=*&order=date.asc');
  const members = await fetchDB2('/rest/v1/monthly_members?select=*');

  console.log(`Loaded ${bookings.length} bookings and ${members.length} members`);

  // Let's see all bookings for 2026-11-03
  const bNov3 = bookings.filter(b => b.date === '2026-11-03');
  console.log('Bookings on 2026-11-03 in DB2:');
  bNov3.forEach(b => console.log(`- ${b.id}: status=${b.status}, name=${b.customer_name}, time=${b.start_time}, court=${b.court_id}`));
}

debugFilter();
