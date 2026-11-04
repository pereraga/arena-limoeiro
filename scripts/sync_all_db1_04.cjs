const fs = require('fs');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');
const match = adminHtml.match(/const ARENA_CLOUD_DBS = (\{[\s\S]*?\});/);
const config = eval('(' + match[1] + ')');

async function syncAllToDb1() {
  const canonical04 = [
    {
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
    },
    {
      id: 'ARENA-5944',
      court_id: 'court-futsal-1788963178368',
      date: '2026-11-04',
      start_time: '15:30',
      end_time: '16:30',
      time: '15:30 às 16:30',
      customer_name: 'Monica',
      customer_phone: '(81) 9952-2226',
      total_price: 400,
      status: 'confirmed',
      booking_type: 'mensalista',
      payment_method: 'pago_balcao',
      observation: 'Pronto para iniciar'
    },
    {
      id: 'ARENA-1535',
      court_id: 'court-society-1',
      date: '2026-11-04',
      start_time: '17:00',
      end_time: '19:00',
      time: '17:00 às 19:00',
      customer_name: 'Diego',
      customer_phone: '(81) 98842-4269',
      total_price: 500,
      status: 'confirmed',
      booking_type: 'mensalista',
      payment_method: 'pagar_local',
      observation: 'Pronto para iniciar'
    },
    {
      id: 'ARENA-7458',
      court_id: 'court-futsal-1788963178368',
      date: '2026-11-04',
      start_time: '18:00',
      end_time: '20:00',
      time: '18:00 às 20:00',
      customer_name: 'Aline',
      customer_phone: '(81) 98765-4321',
      total_price: 400,
      status: 'confirmed',
      booking_type: 'mensalista',
      payment_method: 'pago_balcao',
      observation: 'Pronto para iniciar'
    },
    {
      id: 'ARENA-4440',
      court_id: 'court-futsal-1788963178368',
      date: '2026-11-04',
      start_time: '20:00',
      end_time: '22:00',
      time: '20:00 às 22:00',
      customer_name: 'Jajá',
      customer_phone: '(81) 98765-4321',
      total_price: 500,
      status: 'confirmed',
      booking_type: 'mensalista',
      payment_method: 'pago_balcao',
      observation: 'Pronto para iniciar'
    }
  ];

  for (const b of canonical04) {
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
    console.log(`DB1 upsert ${b.customer_name}: Status ${res.status}`);
  }
}

syncAllToDb1();
