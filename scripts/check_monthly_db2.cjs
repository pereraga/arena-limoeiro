const https = require('https');

const SUPABASE_URL = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

const url = `${SUPABASE_URL}/rest/v1/bookings?select=*&id=eq.monthly-mensal-1792434434802`;

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
      console.log('Result for monthly-mensal-1792434434802 in DB2:', parsed);
    } catch(e) {
      console.log('Raw data:', data);
    }
  });
});
req.on('error', e => console.error(e));
