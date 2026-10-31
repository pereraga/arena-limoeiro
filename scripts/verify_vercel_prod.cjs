const https = require('https');

https.get('https://arenalimoeiro.vercel.app/app.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Contains Relatorios & Backup tab:', data.includes('Relatórios & Backup'));
    console.log('Contains reports router:', data.includes("currentTab === 'reports'"));
  });
}).on('error', err => console.error(err));
