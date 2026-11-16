const https = require('https');

const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

const url = `${db2Url}/rest/v1/bookings?select=id,court_id,booking_type,status,observation&booking_type=eq.bloqueio&limit=5`;

const req = https.request(url, {
  method: 'GET',
  headers: {
    'apikey': db2Key,
    'Authorization': 'Bearer ' + db2Key
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});
req.end();
