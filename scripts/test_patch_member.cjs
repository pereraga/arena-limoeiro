const https = require('https');

const dbs = [
  {
    name: 'DB2',
    url: 'https://aukrcnhuyultkjqsgvea.supabase.co',
    key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
  },
  {
    name: 'DB1',
    url: 'https://brmclyukjfijommbxhks.supabase.co',
    key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7'
  }
];

async function updateGenilson() {
  for (const db of dbs) {
    console.log(`\nTesting PATCH on ${db.name}...`);
    const payload = JSON.stringify({
      court_id: 'court-beach-1', // let's see if FUT 7 works or if schema accepts it
      court_name: 'FUT 7 – SOCCER 7'
    });

    const url = new URL(`${db.url}/rest/v1/monthly_members?id=eq.mensal-1793143167053`);
    
    await new Promise((resolve) => {
      const req = https.request(url, {
        method: 'PATCH',
        headers: {
          'apikey': db.key,
          'Authorization': `Bearer ${db.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`Status: ${res.statusCode}, Body: ${data}`);
          resolve();
        });
      });
      req.on('error', err => {
        console.error(err);
        resolve();
      });
      req.write(payload);
      req.end();
    });
  }
}

updateGenilson();
