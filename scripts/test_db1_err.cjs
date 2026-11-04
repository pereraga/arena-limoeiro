const fs = require('fs');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');
const match = adminHtml.match(/const ARENA_CLOUD_DBS = (\{[\s\S]*?\});/);
const config = eval('(' + match[1] + ')');

async function testOneDb1() {
  const b = {
    id: 'ARENA-2546',
    court_id: 'court-society-2',
    date: '2026-11-04',
    start_time: '15:00',
    end_time: '19:00',
    time: '15:00 às 19:00',
    customer_name: 'Davi',
    customer_phone: '(81) 9958-1034',
    total_price: 600,
    status: 'confirmed',
    booking_type: 'mensalista',
    payment_method: 'pago_balcao',
    observation: 'Pronto para iniciar'
  };
  const res = await fetch(`${config.db1Url}/rest/v1/bookings`, {
    method: 'POST',
    headers: {
      apikey: config.db1Key,
      Authorization: `Bearer ${config.db1Key}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(b)
  });
  console.log('Status:', res.status, await res.text());
}

testOneDb1();
