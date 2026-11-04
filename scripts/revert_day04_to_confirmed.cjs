const fs = require('fs');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');
const match = adminHtml.match(/const ARENA_CLOUD_DBS = (\{[\s\S]*?\});/);
const config = eval('(' + match[1] + ')');

async function revertDay04() {
  console.log('--- REVERTING DAY 04 BOOKINGS TO CONFIRMED ---');

  // 1. Delete duplicate monthly-mensal-* for 2026-11-04 from DB2
  console.log('1. Cleaning up duplicate monthly-mensal-* from DB2...');
  const monthlyIds = [
    'monthly-mensal-1792434474139',
    'monthly-mensal-1792605719811',
    'monthly-mensal-1791847145447',
    'monthly-mensal-1792614686540',
    'monthly-mensal-1792439863387'
  ];
  for (const mid of monthlyIds) {
    try {
      const delRes = await fetch(`${config.db2Url}/rest/v1/bookings?id=eq.${mid}`, {
        method: 'DELETE',
        headers: { apikey: config.db2Key, Authorization: `Bearer ${config.db2Key}` }
      });
      console.log(`  Delete ${mid} from DB2: Status ${delRes.status}`);
    } catch(e) {
      console.log(`  Error deleting ${mid}:`, e.message);
    }
  }

  // 2. Set status = 'confirmed' for ALL 2026-11-04 bookings on DB2 and DB1
  console.log('\n2. Updating all 2026-11-04 bookings to confirmed on DB2...');
  const patchRes2 = await fetch(`${config.db2Url}/rest/v1/bookings?date=eq.2026-11-04`, {
    method: 'PATCH',
    headers: {
      apikey: config.db2Key,
      Authorization: `Bearer ${config.db2Key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      status: 'confirmed',
      observation: 'Pronto para iniciar'
    })
  });
  console.log('DB2 patch status:', patchRes2.status);
  if (patchRes2.ok) {
    const data = await patchRes2.json();
    console.log(`DB2 updated ${data.length} records to confirmed:`);
    data.forEach(b => console.log(`  - [${b.start_time}] ${b.customer_name} (status: ${b.status})`));
  } else {
    console.log('DB2 patch error:', await patchRes2.text());
  }

  console.log('\n3. Updating all 2026-11-04 bookings to confirmed on DB1...');
  const patchRes1 = await fetch(`${config.db1Url}/rest/v1/bookings?date=eq.2026-11-04`, {
    method: 'PATCH',
    headers: {
      apikey: config.db1Key,
      Authorization: `Bearer ${config.db1Key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      status: 'confirmed',
      observation: 'Pronto para iniciar'
    })
  });
  console.log('DB1 patch status:', patchRes1.status);
  if (patchRes1.ok) {
    const data1 = await patchRes1.json();
    console.log(`DB1 updated ${data1.length} records to confirmed:`);
    data1.forEach(b => console.log(`  - [${b.start_time}] ${b.customer_name} (status: ${b.status})`));
  } else {
    console.log('DB1 patch error:', await patchRes1.text());
  }

  // Also ensure the 5 canonical bookings for 04/11 exist on DB1 with status = 'confirmed'
  const canonical04 = [
    {
      id: 'ARENA-2546',
      court_id: 'court-society-2',
      date: '2026-11-04',
      start_time: '15:00',
      end_time: '19:00',
      time: '15:00 às 19:00',
      duration: '4h',
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
      duration: '1h',
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
      duration: '2h',
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
      duration: '2h',
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
      duration: '2h',
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
    for (const dbInfo of [
      { name: 'DB2', url: config.db2Url, key: config.db2Key },
      { name: 'DB1', url: config.db1Url, key: config.db1Key }
    ]) {
      try {
        await fetch(`${dbInfo.url}/rest/v1/bookings?id=eq.${b.id}`, {
          method: 'PATCH',
          headers: {
            apikey: dbInfo.key,
            Authorization: `Bearer ${dbInfo.key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'confirmed',
            observation: 'Pronto para iniciar'
          })
        });
      } catch(e) {}
    }
  }
  console.log('✓ Revert to confirmed completed on both databases!');
}

revertDay04();
