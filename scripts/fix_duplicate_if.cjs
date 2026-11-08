const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../public/admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

const targetStr = `  if (!window.__arenaFeedAutoInterval) {
    // Checagem de expurgo contínuo a cada virada de dia ou ciclo
    try {
      const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '';
      if (todayStr && window.__lastPurgeExecutionDate !== todayStr && typeof window.purgeExpiredCloudBookings === 'function') {
        window.purgeExpiredCloudBookings();
      }
    } catch(eP) {}
    if (!window.__arenaFeedAutoInterval) {
    window.__arenaFeedAutoInterval = setInterval(() => {`;

const fixedStr = `  if (!window.__arenaFeedAutoInterval) {
    // Checagem de expurgo contínuo a cada virada de dia ou ciclo
    try {
      const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '';
      if (todayStr && window.__lastPurgeExecutionDate !== todayStr && typeof window.purgeExpiredCloudBookings === 'function') {
        window.purgeExpiredCloudBookings();
      }
    } catch(eP) {}

    window.__arenaFeedAutoInterval = setInterval(() => {`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, fixedStr);
  fs.writeFileSync(adminPath, content, 'utf8');
  console.log('✓ Corrigido com sucesso!');
} else {
  console.error('Target não encontrado');
}
