const https = require('https');

const url = 'https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth?adm_token=x9k7_limoeiro_sec2026_auth';

setTimeout(() => {
  https.get(url, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Status code:', res.statusCode);
      console.log('Body length:', body.length);
      console.log('Has fixed QR img data:image:', body.includes('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAVwA'));
      console.log('Has fixed subtitle:', body.includes('QR Code Pronto! Aponte a câmera do WhatsApp para conectar.'));
    });
  }).on('error', err => {
    console.error('Error fetching Vercel:', err.message);
  });
}, 4000);
