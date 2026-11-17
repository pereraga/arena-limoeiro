const https = require('https');

function del(url, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'DELETE',
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function clean() {
  const db1Key = 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7';
  const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

  const r1 = await del('https://brmclyukjfijommbxhks.supabase.co/rest/v1/bookings?id=eq.ARENA-B-TEST-NOW', { apikey: db1Key, Authorization: 'Bearer ' + db1Key });
  const r2 = await del('https://aukrcnhuyultkjqsgvea.supabase.co/rest/v1/bookings?id=eq.ARENA-B-TEST-NOW', { apikey: db2Key, Authorization: 'Bearer ' + db2Key });

  console.log('Clean DB1:', r1);
  console.log('Clean DB2:', r2);
}
clean();
