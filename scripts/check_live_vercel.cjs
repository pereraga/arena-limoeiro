const https = require('https');

const url = 'https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth?adm_token=x9k7_limoeiro_sec2026_auth';

https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Body length:', body.length);
    console.log('Contains Finalizar button text:', body.includes('<span>Finalizar</span>'));
    console.log('Contains isPastOrDay3:', body.includes('isPastOrDay3'));
    console.log('Contains any "Receber bola":', body.includes('Receber bola'));
    console.log('Contains any "Bola Recebida":', body.includes('Bola Recebida'));
    console.log('Contains any "Bola Devolvida":', body.includes('Bola Devolvida'));
  });
}).on('error', (e) => {
  console.error('Fetch error:', e.message);
});
