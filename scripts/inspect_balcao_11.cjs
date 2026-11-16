const https = require('https');

const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

const fetchData = (endpoint) => new Promise((resolve) => {
  https.get(db2Url + endpoint, { headers: { apikey: db2Key, Authorization: 'Bearer ' + db2Key } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try { resolve(JSON.parse(data)); } catch(e) { resolve({ error: e.message, raw: data }); }
    });
  }).on('error', (err) => resolve({ error: err.message }));
});

async function main() {
  const members = await fetchData('/rest/v1/monthly_members?select=*');
  const bookings = await fetchData('/rest/v1/bookings?select=*&date=eq.2026-11-11');
  console.log('Members count:', Array.isArray(members) ? members.length : members);
  console.log('Bookings on 11/11:', Array.isArray(bookings) ? bookings.length : bookings);

  if (Array.isArray(members)) {
    console.log('ALL MEMBERS:');
    members.forEach(m => {
      console.log(`ID: ${m.id} | Team: ${m.team_name} | Resp: ${m.responsible_name} | Day: ${m.day_of_week} | Court: ${m.court_id} | Time: ${m.start_time || m.time} - ${m.end_time}`);
    });
  }

  if (Array.isArray(bookings)) {
    console.log('ALL BOOKINGS 11/11:');
    bookings.forEach(b => {
      console.log(`ID: ${b.id} | Name: ${b.customer_name} | Court: ${b.court_id} | Time: ${b.start_time} - ${b.end_time} | Status: ${b.status}`);
    });
  }
}

main();
