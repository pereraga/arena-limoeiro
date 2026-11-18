const https = require('https');

const dbs = [
  {
    name: 'DB1',
    url: 'https://brmclyukjfijommbxhks.supabase.co/rest/v1/monthly_members?select=*',
    key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7'
  },
  {
    name: 'DB2',
    url: 'https://aukrcnhuyultkjqsgvea.supabase.co/rest/v1/monthly_members?select=*',
    key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
  }
];

function fetchDb(db) {
  return new Promise((resolve, reject) => {
    const req = https.get(db.url, {
      headers: {
        'apikey': db.key,
        'Authorization': `Bearer ${db.key}`
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ name: db.name, items: JSON.parse(data) });
        } catch(e) {
          resolve({ name: db.name, error: e.message });
        }
      });
    });
    req.on('error', reject);
  });
}

async function run() {
  const results = await Promise.all(dbs.map(fetchDb));
  results.forEach(r => {
    console.log(`=== ${r.name} monthly_members (${r.items ? r.items.length : 0}) ===`);
    if (r.items) {
      r.items.forEach(m => {
        console.log(`[${m.id}] ${m.team_name || m.responsible_name} | Day: ${m.day_of_week} | Time: ${m.start_time}-${m.end_time} | Court: ${m.court_id} | Status: ${m.status}`);
      });
    }
  });
}

run();
