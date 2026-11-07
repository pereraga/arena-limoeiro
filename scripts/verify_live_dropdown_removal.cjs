const https = require('https');

https.get('https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    const hasVisibleBlock = data.includes('SELEÇÃO VISÍVEL E CONFIRMAÇÃO');
    const hasHiddenSelects = data.includes('style="display:none;"') && data.includes('id="directBookingStart"');
    console.log('Has visible block (should be FALSE):', hasVisibleBlock);
    console.log('Has hidden selects (should be TRUE):', hasHiddenSelects);
  });
}).on('error', err => console.error(err));
