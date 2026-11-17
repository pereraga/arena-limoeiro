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
  const r1 = await fetch('https://brmclyukjfijommbxhks.supabase.co/rest/v1/bookings?id=eq.ARENA-B1950&select=*', { apikey: db1Key, Authorization: 'Bearer ' + db1Key });
  const r2 = await fetch('https://aukrcnhuyultkjqsgvea.supabase.co/rest/v1/bookings?id=eq.ARENA-B1950&select=*', { apikey: db2Key, Authorization: 'Bearer ' + db2Key });
  console.log('ARENA-B1950 in DB1:', r1);
  console.log('ARENA-B1950 in DB2:', r2);
}
check();
