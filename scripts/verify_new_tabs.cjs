const https = require('https');

https.get('https://arenalimoeiro.vercel.app/app.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Contains renderAdminReportsTab:', data.includes('renderAdminReportsTab'));
    console.log('Contains setAdminTab(\'backup\'):', data.includes("setAdminTab('backup')"));
    console.log('Contains financeEvolutionChart:', data.includes('financeEvolutionChart'));
  });
}).on('error', err => console.error(err));
