const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Simulate loading admin.html in JSDOM
try {
  const dom = new JSDOM(content, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth'
  });

  const { window } = dom;

  window.addEventListener('error', (event) => {
    console.error('[JSDOM Runtime Error]:', event.error || event.message);
  });

  console.log('DOM created, waiting for initAdminGames...');
  setTimeout(() => {
    console.log('window.adminGameState:', !!window.adminGameState);
    if (window.adminGameState) {
      console.log('selectedDate:', window.adminGameState.selectedDate);
      console.log('bookings count:', window.adminGameState.bookings?.length);
      console.log('monthlyMembers count:', window.adminGameState.monthlyMembers?.length);
    }
    const container = window.document.getElementById('movementMatchesListContainer');
    console.log('movementMatchesListContainer HTML snippet:');
    console.log(container?.innerHTML?.substring(0, 300));
  }, 1000);

} catch (err) {
  console.error('Crash setting up JSDOM:', err);
}
