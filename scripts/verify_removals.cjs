const https = require('https');

https.get('https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth?adm_token=x9k7_limoeiro_sec2026_auth', res => {
  let d = ''; res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Vercel Status:', res.statusCode);
    console.log('balcaoScheduledGamesCard exists:', d.includes('balcaoScheduledGamesCard'));
    console.log('Visible Início label exists:', d.includes('Início *'));
    console.log('(Promo) exists:', d.includes('(Promo)'));
  });
});
