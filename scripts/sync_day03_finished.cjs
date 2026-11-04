const fs = require('fs');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');
const match = adminHtml.match(/const ARENA_CLOUD_DBS = (\{[\s\S]*?\});/);
const config = eval('(' + match[1] + ')');

async function syncDay03Finished() {
  const day3Bookings = [
    {
      id: 'booking-20261103-ariadnes',
      court_id: 'court-futebol-society-1738962671043',
      date: '2026-11-03',
      start_time: '16:00',
      end_time: '18:00',
      time: '16:00 às 18:00',
      customer_name: 'Ariadnes',
      customer_phone: '(81) 98765-4321',
      total_price: 400,
      status: 'finished',
      booking_type: 'mensalista',
      payment_method: 'Mensalidade Faturada'
    },
    {
      id: 'booking-20261103-esc-ariadnes',
      court_id: 'court-society-1',
      date: '2026-11-03',
      start_time: '16:00',
      end_time: '18:00',
      time: '16:00 às 18:00',
      customer_name: 'Esc Ariadnes',
      customer_phone: '(81) 98765-4321',
      total_price: 500,
      status: 'finished',
      booking_type: 'mensalista',
      payment_method: 'Mensalidade Faturada'
    },
    {
      id: 'booking-20261103-aline',
      court_id: 'court-futebol-society-1738962671043',
      date: '2026-11-03',
      start_time: '18:30',
      end_time: '20:00',
      time: '18:30 às 20:00',
      customer_name: 'Aline',
      customer_phone: '(81) 98765-4321',
      total_price: 400,
      status: 'finished',
      booking_type: 'mensalista',
      payment_method: 'Mensalidade Faturada'
    },
    {
      id: 'booking-20261103-genilson',
      court_id: 'court-society-2',
      date: '2026-11-03',
      start_time: '20:00',
      end_time: '21:30',
      time: '20:00 às 21:30',
      customer_name: 'Genilson',
      customer_phone: '(81) 98765-4321',
      total_price: 600,
      status: 'finished',
      booking_type: 'mensalista',
      payment_method: 'Mensalidade Faturada'
    },
    {
      id: 'booking-20261103-zeluiz',
      court_id: 'court-areia-1',
      date: '2026-11-03',
      start_time: '21:00',
      end_time: '22:30',
      time: '21:00 às 22:30',
      customer_name: 'Zé Luiz',
      customer_phone: '(81) 98765-4321',
      total_price: 500,
      status: 'finished',
      booking_type: 'mensalista',
      payment_method: 'Mensalidade Faturada'
    }
  ];

  for (const dbInfo of [
    { name: 'DB2', url: config.db2Url, key: config.db2Key },
    { name: 'DB1', url: config.db1Url, key: config.db1Key }
  ]) {
    console.log(`Syncing day 03 finished to ${dbInfo.name}...`);
    for (const b of day3Bookings) {
      try {
        const res = await fetch(`${dbInfo.url}/rest/v1/bookings`, {
          method: 'POST',
          headers: {
            apikey: dbInfo.key,
            Authorization: `Bearer ${dbInfo.key}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=representation'
          },
          body: JSON.stringify(b)
        });
        console.log(`  Upsert ${b.customer_name} to ${dbInfo.name}: Status ${res.status}`);
      } catch(e) {
        console.log(`  Error upserting to ${dbInfo.name}:`, e.message);
      }
    }
  }
}

syncDay03Finished();
