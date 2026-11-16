const https = require('https');

const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

const courtId = 'court-society-1';
const payload = JSON.stringify({
  base_price_per_hour: 95.00
});

const url = `${db2Url}/rest/v1/courts?id=eq.${courtId}`;

const req = https.request(url, {
  method: 'PATCH',
  headers: {
    'apikey': db2Key,
    'Authorization': 'Bearer ' + db2Key,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('PATCH Status:', res.statusCode);
    console.log('PATCH Response:', body);
  });
});

req.on('error', e => console.error(e));
req.write(payload);
req.end();
