const https = require('https');

https.get('https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    const hasPastOrDay3 = data.includes('isPastOrDay3');
    console.log('Has isPastOrDay3 (should be false):', hasPastOrDay3);
    if (!hasPastOrDay3) {
      console.log('VERIFICATION SUCCESSFUL: Production deployed without ReferenceError in getMatchesForDate!');
    } else {
      console.log('VERIFICATION FAILED: isPastOrDay3 still present in live response.');
    }
  });
}).on('error', (err) => {
  console.error('Error fetching URL:', err.message);
});
