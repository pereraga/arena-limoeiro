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
  const r1 = await fetch('https://brmclyukjfijommbxhks.supabase.co/rest/v1/bookings?id=eq.test-noshow-1794941088778&select=*', { apikey: db1Key, Authorization: 'Bearer ' + db1Key });
  console.log('Still in DB1?', r1);
}
check();
