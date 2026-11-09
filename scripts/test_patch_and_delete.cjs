const fs = require('fs');
const path = require('path');
const https = require('https');

const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

const testBooking = {
  id: 'ARENA-TEST-CANCEL',
  court_id: 'court-futsal-1788963178368',
  date: '2026-11-09',
  start_time: '23:30',
  end_time: '23:59',
  time: '23:30 às 23:59',
  duration: 29,
  customer_name: 'Teste Cancel',
  customer_phone: '(81) 99999-9999',
  total_price: 50,
  status: 'confirmed',
  booking_type: 'avulso',
  payment_method: 'pix'
};

function doFetch(url, method, body) {
  return new Promise(resolve => {
    const u = new URL(url);
    const req = https.request(u, {
      method,
      headers: {
        apikey: db2Key,
        Authorization: `Bearer ${db2Key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', err => resolve({ error: err.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  console.log('1. Inserting test booking...');
  const ins = await doFetch(`${db2Url}/rest/v1/bookings`, 'POST', testBooking);
  console.log('Insert:', ins.status);

  console.log('2. Updating to cancelled...');
  const upd = await doFetch(`${db2Url}/rest/v1/bookings?id=eq.ARENA-TEST-CANCEL`, 'PATCH', { status: 'cancelled' });
  console.log('Update cancelled:', upd.status, upd.body);

  console.log('3. Deleting test booking...');
  const del = await doFetch(`${db2Url}/rest/v1/bookings?id=eq.ARENA-TEST-CANCEL`, 'DELETE', null);
  console.log('Delete:', del.status, del.body);
})();
