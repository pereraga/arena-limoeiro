const https = require('https');

const url = 'https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth?adm_token=x9k7_limoeiro_sec2026_auth';

setTimeout(() => {
  https.get(url, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Status code:', res.statusCode);
      console.log('Body length:', body.length);
      console.log('Contains whatsappTestOtpCodeInput:', body.includes('whatsappTestOtpCodeInput'));
      console.log('Contains validateWhatsappTestOtpCode:', body.includes('validateWhatsappTestOtpCode'));
      console.log('Contains 4-digit sample [ 1234 ]:', body.includes('1234'));
    });
  }).on('error', err => {
    console.error('Error fetching Vercel:', err.message);
  });
}, 4000);
