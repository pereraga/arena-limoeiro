const https = require('https');

function fetch(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function check() {
  const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';
  const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co/rest/v1/monthly_members?select=*';
  const res2 = await fetch(db2Url, { apikey: db2Key, Authorization: 'Bearer ' + db2Key });
  console.log('DB2 Monthly members count:', res2.length);
  res2.forEach(m => {
    console.log(`[${m.id}] ${m.responsible_name || m.team_name} | Day: ${m.day_of_week} | Time: ${m.start_time || m.time} - ${m.end_time} | Court: ${m.court_id}`);
  });
}
check();
