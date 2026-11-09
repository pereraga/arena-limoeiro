const https = require('https');

https.get('https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    const hasDB2Priority = data.includes('Busca prioritária no DB2');
    const hasInterval4s = data.includes('}, 4000);');
    console.log('Has DB2 priority in live:', hasDB2Priority);
    console.log('Has 4-second sync interval in live:', hasInterval4s);
    if (hasDB2Priority && hasInterval4s) {
      console.log('VERIFICATION SUCCESSFUL: Multi-device cloud synchronization is live!');
    } else {
      console.log('VERIFICATION FAILED: Code not matching.');
    }
  });
}).on('error', (err) => {
  console.error('Error fetching URL:', err.message);
});
