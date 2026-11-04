const fs = require('fs');

async function checkCloudBookings() {
  const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
  const db2Key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1a3Jjbmh1eXVsdGtqc3d2ZWEiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNTk4OTk5OSwiZXhwIjoyMDUxNTY1OTk5fQ.Wc00gV8wR2e_Qj4mSm_B1R_q3eP2K6T5f8a0W9L7h1I';
  
  // Let's get the keys from public/admin.html to be 100% sure
  const adminContent = fs.readFileSync('public/admin.html', 'utf8');
  const m = adminContent.match(/db2Url:\s*['"]([^'"]+)['"],\s*db2Key:\s*['"]([^'"]+)['"]/);
  const url = m ? m[1] : db2Url;
  const key = m ? m[2] : db2Key;
  
  console.log('Fetching bookings from:', url);
  try {
    const res = await fetch(url + '/rest/v1/bookings?date=eq.2026-11-03&select=*', {
      headers: { apikey: key, Authorization: 'Bearer ' + key }
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`Cloud bookings on 2026-11-03 (count: ${data.length}):`);
      data.forEach(b => console.log(`- [${b.id}] ${b.start_time || b.time} | ${b.customer_name} | Court: ${b.court_id} | Status: ${b.status} | Price: R$ ${b.total_price}`));
    } else {
      console.log('Error status:', res.status, await res.text());
    }
  } catch(e) {
    console.error('Fetch failed:', e);
  }

  // Also check monthly_members for terca
  try {
    const resM = await fetch(url + '/rest/v1/monthly_members?day_of_week=ilike.terca*&select=*', {
      headers: { apikey: key, Authorization: 'Bearer ' + key }
    });
    if (resM.ok) {
      const members = await resM.json();
      console.log(`\nMonthly members on terca (count: ${members.length}):`);
      members.forEach(m => console.log(`- [${m.id}] ${m.start_time || m.time} | Team: ${m.team_name} | Resp: ${m.responsible_name} | Court: ${m.court_id} | Price: R$ ${m.monthly_price}`));
    }
  } catch(e) {
    console.error('Fetch members failed:', e);
  }
}

checkCloudBookings();
