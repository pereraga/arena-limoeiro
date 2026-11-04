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

async function inspect() {
  const bookings = await fetchDB2('/rest/v1/bookings?date=eq.2026-11-03');
  console.log('Bookings on 2026-11-03:', bookings.length);
  bookings.forEach(b => {
    console.log(`- ID: ${b.id} | Customer: ${b.customer_name} | Status: ${b.status} | Court: ${b.court_id} | Time: ${b.start_time}`);
  });
}

inspect();
