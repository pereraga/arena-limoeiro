const https = require('https');

const SUPABASE_URL = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

const url = `${SUPABASE_URL}/rest/v1/bookings?select=id,customer_name,date,court_id,start_time,status,observation&or=(date.eq.2026-11-02,date.eq.2026-11-03)&limit=50`;

const req = https.get(url, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Bookings on 02/11 and 03/11 in DB2:', parsed);
    } catch(e) {
      console.log('Raw data:', data);
    }
  });
});
req.on('error', e => console.error(e));
