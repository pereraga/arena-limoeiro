const https = require('https');

function post(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
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

async function testUpsert() {
  const db1Key = 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7';
  const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

  const item = {
    id: 'test-noshow-1794941088778',
    court_id: 'court-beach-1',
    date: '2026-11-17',
    start_time: '23:30',
    end_time: '23:59',
    time: '23:30 às 23:59',
    duration: 60,
    customer_name: 'Test NoShow',
    customer_phone: '1234567890',
    total_price: 10,
    status: 'cancelled',
    booking_type: 'avulso',
    payment_method: 'pix',
    observation: 'Não compareceu'
  };

  const r1 = await post(
    'https://brmclyukjfijommbxhks.supabase.co/rest/v1/bookings',
    {
      apikey: db1Key,
      Authorization: 'Bearer ' + db1Key,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    item
  );

  const r2 = await post(
    'https://aukrcnhuyultkjqsgvea.supabase.co/rest/v1/bookings',
    {
      apikey: db2Key,
      Authorization: 'Bearer ' + db2Key,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    item
  );

  console.log('UPSERT test-noshow DB1:', r1);
  console.log('UPSERT test-noshow DB2:', r2);
}
testUpsert();
