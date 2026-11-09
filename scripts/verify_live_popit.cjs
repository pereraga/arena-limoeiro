const https = require('https');

https.get('https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    const hasPopIt = data.includes('arenaPopItNotification');
    const hasShowPopIt = data.includes('window.showArenaPopIt');
    console.log('Has arenaPopItNotification element:', hasPopIt);
    console.log('Has window.showArenaPopIt:', hasShowPopIt);
    if (hasPopIt && hasShowPopIt) {
      console.log('VERIFICATION SUCCESSFUL: 30s Pop-it notification is live in production!');
    } else {
      console.log('VERIFICATION FAILED: Pop-it not found.');
    }
  });
}).on('error', (err) => {
  console.error('Error fetching URL:', err.message);
});
