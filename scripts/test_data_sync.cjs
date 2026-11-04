const fs = require('fs');

async function testSupabase() {
  try {
    const adminHtml = fs.readFileSync('public/admin.html', 'utf8');
    const db1Match = adminHtml.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
    const db2Match = adminHtml.match(/SUPABASE_URL_DB2\s*=\s*['"]([^'"]+)['"]/);
    console.log('DB1 URL:', db1Match ? db1Match[1] : 'not found');
    console.log('DB2 URL:', db2Match ? db2Match[1] : 'not found');

    const res = await fetch('https://arenalimoeiro.vercel.app/api/sync');
    console.log('/api/sync status:', res.status);
    const data = await res.json();
    console.log('/api/sync keys:', Object.keys(data));
    console.log('Bookings count:', data.bookings ? data.bookings.length : 'none');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testSupabase();
