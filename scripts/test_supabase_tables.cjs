const fs = require('fs');

async function testSupabaseTables() {
  const url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1a3Jjbmh1eXVsdGtqc3d2ZWEiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNTk4OTk5OSwiZXhwIjoyMDUxNTY1OTk5fQ.Wc00gV8wR2e_Qj4mSm_B1R_q3eP2K6T5f8a0W9L7h1I';

  const tables = ['bookings', 'courts', 'monthly_members', 'customers', 'sports', 'modalities', 'blocked_slots'];
  for (const table of tables) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }
      });
      console.log(`Table '${table}': Status ${res.status} ${res.statusText}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`   Sample count: ${data.length}`, data[0] ? Object.keys(data[0]) : '(empty table)');
      }
    } catch(e) {
      console.log(`Table '${table}': Error`, e.message);
    }
  }
}

testSupabaseTables();
