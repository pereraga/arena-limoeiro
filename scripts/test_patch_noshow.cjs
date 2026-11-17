const https = require('https');

function patch(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'PATCH',
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function testPatch() {
  const db1Key = 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7';
  const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

  const r1 = await patch(
    'https://brmclyukjfijommbxhks.supabase.co/rest/v1/bookings?id=eq.test-noshow-1794941088778',
    {
      apikey: db1Key,
      Authorization: 'Bearer ' + db1Key,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    { status: 'cancelled', observation: 'Não compareceu (No-Show)' }
  );

  const r2 = await patch(
    'https://aukrcnhuyultkjqsgvea.supabase.co/rest/v1/bookings?id=eq.test-noshow-1794941088778',
    {
      apikey: db2Key,
      Authorization: 'Bearer ' + db2Key,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    { status: 'cancelled', observation: 'Não compareceu (No-Show)' }
  );

  console.log('PATCH test-noshow DB1:', r1);
  console.log('PATCH test-noshow DB2:', r2);
}
testPatch();
