const https = require('https');

https.get('https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    const hasCancelFix = data.includes('Exclui em bookings e em monthly_members');
    console.log('Has cancelFix in production:', hasCancelFix);
    if (hasCancelFix) {
      console.log('VERIFICATION SUCCESSFUL: Direct cloud deletion deployed to production!');
    } else {
      console.log('VERIFICATION FAILED: Fix not detected.');
    }
  });
}).on('error', (err) => {
  console.error('Error fetching URL:', err.message);
});
