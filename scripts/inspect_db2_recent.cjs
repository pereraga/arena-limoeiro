const https = require('https');

const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

https.get(`${db2Url}/rest/v1/bookings?select=*&order=created_at.desc&limit=15`, {
  headers: { apikey: db2Key, Authorization: `Bearer ${db2Key}` }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const bookings = JSON.parse(data);
    console.log(`Last 15 bookings in DB2:`);
    bookings.forEach(b => {
      console.log(`- ID: ${b.id} | Name: ${b.customer_name || b.name} | Date: ${b.date} | Time: ${b.start_time}-${b.end_time} | Status: ${b.status} | CreatedAt: ${b.created_at}`);
    });
  });
});
