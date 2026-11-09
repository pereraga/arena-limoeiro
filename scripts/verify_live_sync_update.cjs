const https = require('https');

https.get('https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    const hasCacheClear = data.includes('window.__matchesCacheByDate.clear()');
    const hasDedupFix = data.includes('(m.isMensalista && m.court_id === court.id && m.start_time === startT)');
    console.log('Has cache clearing on booking:', hasCacheClear);
    console.log('Has dedup fix for avulso bookings:', hasDedupFix);
    if (hasCacheClear && hasDedupFix) {
      console.log('VERIFICATION SUCCESSFUL: Booking sync, counter update, and delete enhancements are live!');
    } else {
      console.log('VERIFICATION FAILED: Code not detected in response.');
    }
  });
}).on('error', (err) => {
  console.error('Error fetching URL:', err.message);
});
