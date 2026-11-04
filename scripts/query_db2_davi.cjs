const https = require('https');

const SUPABASE_URL = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

const url = `${SUPABASE_URL}/rest/v1/bookings?select=*&customer_name=ilike.*Davi*`;

const req = https.get(url, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Bookings with Davi in DB2:', parsed.length);
      console.log(parsed.map(b => ({ id: b.id, name: b.customer_name, date: b.date, time: b.time || b.start_time, status: b.status, obs: b.observation })));
    } catch(e) {
      console.log('Raw data:', data);
    }
  });
});
req.on('error', e => console.error(e));
