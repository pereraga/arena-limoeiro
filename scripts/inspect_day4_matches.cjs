const fs = require('fs');

async function inspectDay4() {
  const syncRes = await fetch('https://arenalimoeiro.vercel.app/api/sync');
  const syncData = await syncRes.json();
  const bookings = syncData?.data?.bookings || [];
  const members = syncData?.data?.monthlyMembers || syncData?.data?.monthly_members || [];

  console.log('Bookings on 2026-11-04:');
  bookings.filter(b => b.date === '2026-11-04').forEach(b => {
    console.log(`- [${b.court_id}] ${b.time || (b.start_time + ' às ' + b.end_time)} | ${b.customer_name} | status: ${b.status}`);
  });

  console.log('\nMonthly members for quarta:');
  members.filter(m => (m.day_of_week || '').toLowerCase().includes('quarta')).forEach(m => {
    console.log(`- [${m.court_id}] ${m.time || (m.start_time + ' às ' + m.end_time)} | ${m.team_name || m.responsible_name} | status: ${m.status}`);
  });
}

inspectDay4();
