const db1Url = 'https://cbzlayukjfijommbxhks.supabase.co';
const db1Key = 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7';
const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

async function testFetch() {
  console.log('Fetching from Supabase...');
  try {
    const resB2 = await fetch(db2Url + '/rest/v1/bookings?select=*', {
      headers: { apikey: db2Key, Authorization: 'Bearer ' + db2Key }
    });
    const b2 = await resB2.json();
    console.log('DB2 Bookings:', Array.isArray(b2) ? b2.length : b2);
    if (Array.isArray(b2) && b2.length > 0) {
      console.log('Sample booking:', b2[0]);
    }
  } catch(e) {
    console.error('DB2 Bookings error:', e.message);
  }

  try {
    const resM2 = await fetch(db2Url + '/rest/v1/monthly_members?select=*', {
      headers: { apikey: db2Key, Authorization: 'Bearer ' + db2Key }
    });
    const m2 = await resM2.json();
    console.log('DB2 Monthly Members:', Array.isArray(m2) ? m2.length : m2);
    if (Array.isArray(m2) && m2.length > 0) {
      console.log('Sample member:', m2[0]);
    }
  } catch(e) {
    console.error('DB2 Monthly error:', e.message);
  }

  try {
    const resC2 = await fetch(db2Url + '/rest/v1/customers?select=*', {
      headers: { apikey: db2Key, Authorization: 'Bearer ' + db2Key }
    });
    const c2 = await resC2.json();
    console.log('DB2 Customers:', Array.isArray(c2) ? c2.length : c2);
  } catch(e) {
    console.error('DB2 Customers error:', e.message);
  }
}

testFetch();
