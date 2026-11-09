const db1Url = 'https://brmclyukjfijommbxhks.supabase.co';
const db1Key = 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7';
const db2Url = 'https://aukrcnhuyultkjqsgvea.supabase.co';
const db2Key = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

async function run() {
  const [r1, r2] = await Promise.all([
    fetch(db1Url + '/rest/v1/bookings?select=id,date,start_time,end_time,court_id,customer_name,status,booking_type,total_price,created_at', {
      headers: { apikey: db1Key, Authorization: 'Bearer ' + db1Key }
    }),
    fetch(db2Url + '/rest/v1/bookings?select=id,date,start_time,end_time,court_id,customer_name,status,booking_type,total_price,created_at', {
      headers: { apikey: db2Key, Authorization: 'Bearer ' + db2Key }
    })
  ]);

  const b1 = await r1.json();
  const b2 = await r2.json();

  console.log('Total bookings in DB1:', b1.length);
  console.log('Total bookings in DB2:', b2.length);

  // Focus on 2026-11-09 (Segunda-feira) or all dates
  function analyze(list, tag) {
    console.log(`\n=== Analyzing ${tag} ===`);
    const dateCounts = {};
    for (const b of list) {
      dateCounts[b.date] = (dateCounts[b.date] || 0) + 1;
    }
    console.log('Bookings per date:', dateCounts);

    // Group by date + court_id + start_time + (customer_name normalized)
    const map = {};
    for (const b of list) {
      const cname = (b.customer_name || '').toLowerCase().trim();
      const key = `${b.date} | court:${b.court_id} | ${b.start_time}-${b.end_time} | ${cname}`;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    }

    const dups = Object.entries(map).filter(([k, arr]) => arr.length > 1);
    console.log(`Total duplicate clusters in ${tag}:`, dups.length);
    for (const [k, arr] of dups) {
      console.log(`\nCluster: ${k} (count: ${arr.length})`);
      for (const item of arr) {
        console.log(`  -> ID: ${item.id} | status: ${item.status} | type: ${item.booking_type} | price: ${item.total_price} | created: ${item.created_at}`);
      }
    }
    return dups;
  }

  analyze(b1, 'DB1');
  analyze(b2, 'DB2');
}

run().catch(console.error);
