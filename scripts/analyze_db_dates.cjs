const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

async function run() {
  const resB2 = await fetch(db2Url + '/rest/v1/bookings?select=*', {
    headers: { apikey: db2Key, Authorization: 'Bearer ' + db2Key }
  });
  const bookings = await resB2.json();
  const dates = {};
  bookings.forEach(b => {
    dates[b.date] = (dates[b.date] || 0) + 1;
  });
  console.log('Bookings dates breakdown:', dates);

  const resM2 = await fetch(db2Url + '/rest/v1/monthly_members?select=*', {
    headers: { apikey: db2Key, Authorization: 'Bearer ' + db2Key }
  });
  const members = await resM2.json();
  console.log('Total members in DB2:', members.length);
  members.forEach(m => {
    console.log(`Member: ${m.team_name || m.responsible_name} | Day: ${m.day_of_week} | Status: ${m.status} | Price: ${m.monthly_price}`);
  });
}

run();
