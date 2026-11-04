const fs = require('fs');

// Load HTML and extract window.adminGameState mock and functions
const html = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html', 'utf8');

// Let's test with exact logic from admin.html
const https = require('https');

function fetchDB2(endpoint) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'aukrcnhuyultkjqsgvea.supabase.co',
      path: endpoint,
      method: 'GET',
      headers: {
        'apikey': 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi',
        'Authorization': 'Bearer sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const bookings = await fetchDB2('/rest/v1/bookings?select=*&order=date.asc');
  const members = await fetchDB2('/rest/v1/monthly_members?select=*&order=day_of_week.asc');
  
  console.log(`Fetched ${bookings.length} bookings, ${members.length} members`);
  
  const nov3Bookings = bookings.filter(b => b.date === '2026-11-03');
  console.log('Nov 3 bookings count:', nov3Bookings.length);
  nov3Bookings.forEach(b => {
    console.log(`- ${b.id}: ${b.customer_name} | ${b.start_time} | status: ${b.status} | court: ${b.court_id}`);
  });
}

run();
