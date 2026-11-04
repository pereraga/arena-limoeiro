const https = require('https');

const url = 'https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth?adm_token=x9k7_limoeiro_sec2026_auth';

https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Body length:', body.length);
    console.log('Contains whatsappQrImage:', body.includes('whatsappQrImage'));
    console.log('Contains whatsappConnectedPanel:', body.includes('whatsappConnectedPanel'));
    console.log('Contains loadWhatsappQrCodeLive:', body.includes('loadWhatsappQrCodeLive'));
    console.log('Contains sendWhatsappTestOtpCode:', body.includes('sendWhatsappTestOtpCode'));
    console.log('Contains whatsappTestOtpPhone:', body.includes('whatsappTestOtpPhone'));
  });
}).on('error', err => {
  console.error('Error fetching Vercel:', err.message);
});
