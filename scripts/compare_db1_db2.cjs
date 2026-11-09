const fs = require('fs');
const path = require('path');
const https = require('https');

const dbs = [
  { name: 'DB2', url: 'https://aukrcnhuyultkjqsgvea.supabase.co', key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi' },
  { name: 'DB1', url: 'https://brmclyukjfijommbxhks.supabase.co', key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7' }
];

async function fetchBookings(db) {
  return new Promise(resolve => {
    https.get(`${db.url}/rest/v1/bookings?select=*&order=date.asc`, {
      headers: { apikey: db.key, Authorization: `Bearer ${db.key}` }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

(async () => {
  const b1 = await fetchBookings(dbs[1]); // DB1
  const b2 = await fetchBookings(dbs[0]); // DB2
  console.log(`DB1 bookings count: ${b1.length}`);
  console.log(`DB2 bookings count: ${b2.length}`);

  const b1Dates = b1.map(b => b.date);
  const b2Dates = b2.map(b => b.date);

  const b1_nov09 = b1.filter(b => b.date === '2026-11-09');
  const b2_nov09 = b2.filter(b => b.date === '2026-11-09');

  console.log(`DB1 2026-11-09 count: ${b1_nov09.length}`);
  console.log(`DB2 2026-11-09 count: ${b2_nov09.length}`);

  console.log('DB1 IDs on Nov 09:', b1_nov09.map(b => b.id));
  console.log('DB2 IDs on Nov 09:', b2_nov09.map(b => b.id));
})();
