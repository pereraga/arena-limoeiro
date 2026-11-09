const fs = require('fs');
const path = require('path');
const https = require('https');

const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

https.get(`${db2Url}/rest/v1/monthly_members?select=*`, {
  headers: { apikey: db2Key, Authorization: `Bearer ${db2Key}` }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const members = JSON.parse(data);
    console.log(`Total monthly_members in DB2: ${members.length}`);
    const segundamembers = members.filter(m => (m.day_of_week || '').toLowerCase().includes('segunda'));
    console.log(`Members for Monday ('segunda'): ${segundamembers.length}`);
    segundamembers.forEach(m => {
      console.log(`- ID: ${m.id} | Team: ${m.team_name} | Resp: ${m.responsible_name} | Time: ${m.start_time || m.time} | Court: ${m.court_id} | Status: ${m.status}`);
    });
  });
});
