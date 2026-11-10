const https = require('https');

const db = {
  url: 'https://aukrcnhuyultkjqsgvea.supabase.co',
  key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
};

const payload = JSON.stringify({
  court_id: 'court-beach-1' // without court_name
});

const url = new URL(`${db.url}/rest/v1/monthly_members?id=eq.mensal-1793143167053`);

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
  });
});
req.write(payload);
req.end();
