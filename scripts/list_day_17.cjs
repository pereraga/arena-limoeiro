const https = require('https');

const dbs = [
  {
    name: 'DB1',
    url: 'https://brmclyukjfijommbxhks.supabase.co/rest/v1/bookings?select=*&date=eq.2026-11-17',
    key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7'
  },
  {
    name: 'DB2',
    url: 'https://aukrcnhuyultkjqsgvea.supabase.co/rest/v1/bookings?select=*&date=eq.2026-11-17',
    key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
  }
];

function fetchDb(db) {
  return new Promise((resolve, reject) => {
    const req = https.get(db.url, {
      headers: {
        'apikey': db.key,
        'Authorization': `Bearer ${db.key}`
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ name: db.name, items: JSON.parse(data) });
        } catch(e) {
          resolve({ name: db.name, error: e.message });
        }
      });
    });
    req.on('error', reject);
  });
}

async function run() {
  const results = await Promise.all(dbs.map(fetchDb));
  results.forEach(r => {
    console.log(`=== ${r.name} 2026-11-17 bookings (${r.items.length}) ===`);
    r.items.forEach(b => {
      console.log(`[${b.id}] ${b.customer_name} | ${b.court_id} | ${b.start_time}-${b.end_time} | Status: ${b.status} | Type: ${b.booking_type} | Obs: ${b.observation}`);
    });
  });
}

run();
