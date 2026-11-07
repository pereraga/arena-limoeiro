const fs = require('fs');

async function checkDetails() {
  const dbs = {
    db2Url: 'https://aukrcnhuyultkjqsgvea.supabase.co',
    db2Key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi',
    db1Url: 'https://brmclyukjfijommbxhks.supabase.co',
    db1Key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7'
  };

  const resC = await fetch(dbs.db2Url + '/rest/v1/courts?select=*', {
    headers: { apikey: dbs.db2Key, Authorization: 'Bearer ' + dbs.db2Key }
  });
  const courts = await resC.json();
  const courtsMap = {};
  courts.forEach(c => {
    courtsMap[c.id] = c.name;
  });
  console.log('Courts map:', courtsMap);

  const resM = await fetch(dbs.db2Url + '/rest/v1/monthly_members?select=*', {
    headers: { apikey: dbs.db2Key, Authorization: 'Bearer ' + dbs.db2Key }
  });
  const members = await resM.json();

  console.log('\n=== FIXOS / MENSALISTAS POR QUADRA ===');
  members.forEach(m => {
    const cName = courtsMap[m.court_id] || m.court_id;
    console.log(`[${m.id}] ${m.responsible_name || m.team_name} -> Quadra/Campo: ${cName} (${m.court_id}) | Dia: ${m.day_of_week} | Horas: ${m.start_time}-${m.end_time}`);
  });
}

checkDetails().catch(console.error);
