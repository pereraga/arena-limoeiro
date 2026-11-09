const https = require('https');

const dbs = [
  { name: 'DB2', url: 'https://aukrcnhuyultkjqsgvea.supabase.co', key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi' },
  { name: 'DB1', url: 'https://brmclyukjfijommbxhks.supabase.co', key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7' }
];

async function checkDateBookings(db) {
  return new Promise(resolve => {
    https.get(`${db.url}/rest/v1/bookings?date=eq.2026-11-09&select=*`, {
      headers: {
        apikey: db.key,
        Authorization: `Bearer ${db.key}`
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve({ error: data });
        }
      });
    }).on('error', err => resolve({ error: err.message }));
  });
}

(async () => {
  for (const db of dbs) {
    const list = await checkDateBookings(db);
    console.log(`\n=== Bookings on 2026-11-09 in ${db.name}: Count = ${list.length} ===`);
    list.forEach(b => {
      console.log(`- ID: ${b.id} | Name: ${b.customer_name || b.name} | Time: ${b.start_time}-${b.end_time} | Court: ${b.court_id} | Status: ${b.status}`);
    });
  }
})();
