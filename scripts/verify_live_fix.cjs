const https = require('https');

https.get('https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    const hasFixedScope = data.includes('const dateStr = dateInput?.value || window.adminGameState?.selectedDate');
    const hasToggle = data.includes('toggleBalcaoTimeSlot');
    console.log('Has fixed dateStr scope in toggleBalcaoTimeSlot:', hasFixedScope);
    console.log('Has toggleBalcaoTimeSlot:', hasToggle);
    if (hasFixedScope) {
      console.log('VERIFICATION SUCCESSFUL: Production has the fix deployed!');
    } else {
      console.log('VERIFICATION FAILED: Fix not detected in response.');
    }
  });
}).on('error', (err) => {
  console.error('Error fetching URL:', err.message);
});
