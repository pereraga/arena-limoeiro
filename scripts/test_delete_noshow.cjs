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

async function testDel() {
  const db1Key = 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7';
  const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

  const r1 = await del('https://brmclyukjfijommbxhks.supabase.co/rest/v1/bookings?id=eq.test-noshow-1794941088778', {
    apikey: db1Key,
    Authorization: 'Bearer ' + db1Key,
    Prefer: 'return=representation'
  });

  const r2 = await del('https://aukrcnhuyultkjqsgvea.supabase.co/rest/v1/bookings?id=eq.test-noshow-1794941088778', {
    apikey: db2Key,
    Authorization: 'Bearer ' + db2Key,
    Prefer: 'return=representation'
  });

  console.log('DELETE test-noshow DB1:', r1);
  console.log('DELETE test-noshow DB2:', r2);
}
testDel();
