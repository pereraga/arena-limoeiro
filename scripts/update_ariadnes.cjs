const https = require('https');

const SUPABASE_URL = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

const req = https.request(`${SUPABASE_URL}/rest/v1/bookings?id=eq.monthly-mensal-1792437535347`, {
  method: 'PATCH',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  }
}, res => {
  console.log('Update monthly-mensal-1792437535347 status:', res.statusCode);
});
req.write(JSON.stringify({ status: 'confirmed' }));
req.end();
