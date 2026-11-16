const https = require('https');
const url = "https://aukrcnhuyultkjqsgvea.supabase.co/rest/v1/monthly_members?select=*";
const headers = {
  "apikey": "sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi",
  "Authorization": "Bearer sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi"
};
https.get(url, { headers }, (res) => {
  let data = "";
  res.on("data", c => data += c);
  res.on("end", () => {
    try {
      const list = JSON.parse(data);
      const quarta = list.filter(m => (m.day_of_week || "").toLowerCase().includes("quarta"));
      console.log(`Found ${quarta.length} monthly members for quarta:`);
      quarta.forEach(m => {
        console.log(`ID: ${m.id} | Resp: ${m.responsible_name} | Team: ${m.team_name} | Court: ${m.court_id} | Time: ${m.start_time || m.time} - ${m.end_time} | Status: ${m.status}`);
      });
    } catch(e) {
      console.log(e);
    }
  });
});
