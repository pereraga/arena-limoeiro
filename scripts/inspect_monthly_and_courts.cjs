const fs = require('fs');

async function inspectData() {
  const dbs = {
    db2Url: 'https://aukrcnhuyultkjqsgvea.supabase.co',
    db2Key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi',
    db1Url: 'https://brmclyukjfijommbxhks.supabase.co',
    db1Key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7'
  };

  console.log('=== COURTS DB2 ===');
  const resC = await fetch(dbs.db2Url + '/rest/v1/courts?select=*', {
    headers: { apikey: dbs.db2Key, Authorization: 'Bearer ' + dbs.db2Key }
  });
  const courts = await resC.json();
  console.log(courts);

  console.log('=== MONTHLY MEMBERS DB2 ===');
  const resM = await fetch(dbs.db2Url + '/rest/v1/monthly_members?select=*&order=created_at.asc', {
    headers: { apikey: dbs.db2Key, Authorization: 'Bearer ' + dbs.db2Key }
  });
  const members = await resM.json();
  members.forEach((m, i) => {
    console.log(
      (i+1) + '. ID: ' + m.id +
      ' | Nome: ' + (m.responsible_name || m.team_name) +
      ' | CourtId: ' + m.court_id +
      ' | Dia: ' + m.day_of_week +
      ' | Horario: ' + m.start_time + '-' + m.end_time +
      ' | Preço: ' + m.monthly_price +
      ' | Obs: ' + (m.observation || '').slice(0, 50)
    );
  });

  console.log('=== BOOKINGS SAMPLE (MENSALISTAS / FIXOS) DB2 ===');
  const resB = await fetch(dbs.db2Url + '/rest/v1/bookings?select=*&booking_type=eq.mensalista&limit=10', {
    headers: { apikey: dbs.db2Key, Authorization: 'Bearer ' + dbs.db2Key }
  });
  const bookings = await resB.json();
  console.log('Mensalistas bookings found:', bookings.length);
  bookings.forEach(b => {
    console.log('Booking:', b.id, b.customer_name, b.court_id, b.date, b.time, b.status);
  });
}

inspectData().catch(console.error);
