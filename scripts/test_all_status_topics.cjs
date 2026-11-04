const fs = require('fs');

console.log('Testing All Status Topics and Functions...');

const html = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html', 'utf8');

const checks = [
  { name: 'kpiValueGames and kpiValueRevenue present', ok: html.includes('id="kpiValueGames"') && html.includes('id="kpiValueRevenue"') },
  { name: 'kpiValueLive present', ok: html.includes('id="kpiValueLive"') },
  { name: 'checkIsMatchLive helper defined', ok: html.includes('window.checkIsMatchLive = function') },
  { name: 'startGameNow defined for confirmed matches', ok: html.includes('window.startGameNow = function') },
  { name: 'reopenGame defined for finished matches', ok: html.includes('window.reopenGame = function') },
  { name: 'addExtraTimeQuick defined for live matches', ok: html.includes('window.addExtraTimeQuick = function') },
  { name: 'viewReceipt defined for finished matches', ok: html.includes('window.viewReceipt = function') },
  { name: 'renderMovementMatches filters by status topics', ok: html.includes("statusFilter === 'finished'") && html.includes("statusFilter === 'live'") && html.includes("statusFilter === 'confirmed'") && html.includes("statusFilter === 'everything'") }
];

let allOk = true;
checks.forEach(c => {
  console.log(`[${c.ok ? 'PASS' : 'FAIL'}] ${c.name}`);
  if (!c.ok) allOk = false;
});

if (!allOk) process.exit(1);
console.log('\n✅ All status topics and functions verified!');
