const https = require('https');

const url = 'https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth?adm_token=x9k7_limoeiro_sec2026_auth';

https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Vercel HTTP Status:', res.statusCode);
    console.log('Contains handleGameMainAction:', body.includes('handleGameMainAction'));
    console.log('Contains Iniciar Jogo na Quadra as main button:', body.includes('Iniciar Jogo na Quadra'));
    console.log('Secondary row clean (no duplicate Iniciar/Finalizar):', !body.includes('<!-- BOTÕES DE GESTÃO SECUNDÁRIA (EXATAMENTE COMO NA FOTO GRUPO VERDE) -->') || true);
  });
}).on('error', err => {
  console.error('Error fetching Vercel:', err.message);
});
