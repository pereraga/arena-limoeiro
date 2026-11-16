const { createClient } = require('@supabase/supabase-js');

const db2Url = 'https://brmclyukjfijommbxhks.supabase.co';
const db2Key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybWNseXVramZpam9tbWJ4aGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4NTQ1MTIsImV4cCI6MjA1NDQzMDUxMn0.0n3U_Jp74n6a11N6eFh8p_w6k5i0h-6h_7h8_9h0_1';

async function testCourts() {
  const sb = createClient(db2Url, db2Key);
  const { data, error } = await sb.from('courts').select('*');
  console.log('Courts error:', error);
  console.log('Courts count:', data ? data.length : 0);
  if (data) console.log('Sample court columns:', Object.keys(data[0] || {}));
  if (data) console.log('Courts data:', JSON.stringify(data, null, 2));
}

testCourts();
