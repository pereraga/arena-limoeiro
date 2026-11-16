const https = require('https');

const db1Url = 'https://brmclyukjfijommbxhks.supabase.co';
const db1Key = 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7';

const courtId = 'court-society-1';
const payload = JSON.stringify({
  base_price_per_hour: 95.00
});

const url = `${db1Url}/rest/v1/courts?id=eq.${courtId}`;

const req = https.request(url, {
  method: 'PATCH',
  headers: {
    'apikey': db1Key,
    'Authorization': 'Bearer ' + db1Key,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('DB1 PATCH Status:', res.statusCode);
    console.log('DB1 PATCH Response:', body);
  });
});

req.on('error', e => console.error(e));
req.write(payload);
req.end();
