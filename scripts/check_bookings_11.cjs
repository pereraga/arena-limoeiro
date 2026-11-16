const https = require('https');
const url = "https://aukrcnhuyultkjqsgvea.supabase.co/rest/v1/bookings?date=eq.2026-11-11&select=*";
const headers = {
  "apikey": "sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi",
  "Authorization": "Bearer sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi"
};
https.get(url, { headers }, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    try {
      const parsed = JSON.parse(data);
      console.log(`Found ${parsed.length} bookings for 2026-11-11:`);
      parsed.forEach(b => {
        console.log(`- ID: ${b.id}, Name: ${b.customer_name}, Court: ${b.court_id}, Time: ${b.start_time || b.time} - ${b.end_time}, Status: ${b.status}`);
      });
    } catch(e) {
      console.log("Raw:", data);
    }
  });
});
