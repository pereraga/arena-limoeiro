const https = require('https');

https.get('https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth', (res) => {
  console.log('Status code:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Contains balcaoScheduledGamesContainer?', data.includes('balcaoScheduledGamesContainer'));
    console.log('Contains unchecked balcaoHideOccupiedToggle?', data.includes('id="balcaoHideOccupiedToggle" onchange="renderBalcaoTimeSlots()" class='));
    console.log('Verification COMPLETE!');
  });
}).on('error', (e) => {
  console.error('Error fetching live URL:', e.message);
});
