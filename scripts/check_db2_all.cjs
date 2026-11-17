const https = require('https');

function fetch(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function check() {
  const db1Key = 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7';
  const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';
  const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co/rest/v1/bookings?select=*&order=date.asc';

  const res2 = await fetch(db2Url, { apikey: db2Key, Authorization: 'Bearer ' + db2Key });
  console.log('Total bookings in DB2:', res2.length);
  const nov17 = res2.filter(b => b.date === '2026-11-17');
  console.log('Bookings on 2026-11-17 in DB2:', nov17.map(b => ({ id: b.id, name: b.customer_name, status: b.status, court: b.court_id, time: b.time })));
}
check();
