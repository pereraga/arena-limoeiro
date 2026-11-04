async function checkSyncData() {
  const res = await fetch('https://arenalimoeiro.vercel.app/api/sync');
  const json = await res.json();
  console.log('Success:', json.success);
  console.log('Data keys:', json.data ? Object.keys(json.data) : 'null');
  if (json.data && json.data.bookings) {
    console.log('Total bookings in sync:', json.data.bookings.length);
  }
}

checkSyncData();
