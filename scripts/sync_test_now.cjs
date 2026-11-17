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

async function write() {
  const db1Key = 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7';
  const item = {
    id: 'ARENA-B-TEST-NOW',
    court_id: 'court-beach-1',
    customer_id: null,
    date: '2026-11-17',
    start_time: '18:30',
    end_time: '20:30',
    time: '18:30 às 20:30',
    duration: 120,
    customer_name: 'Thiago Teste',
    customer_phone: '81999999999',
    total_price: 220,
    status: 'confirmed',
    booking_type: 'avulso',
    payment_method: 'pix',
    product_cart: {},
    observation: 'Reserva Balcão Direta'
  };

  const res = await post(
    'https://brmclyukjfijommbxhks.supabase.co/rest/v1/bookings',
    {
      apikey: db1Key,
      Authorization: 'Bearer ' + db1Key,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    item
  );
  console.log('Result write DB1:', res);
}
write();
