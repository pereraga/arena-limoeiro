const fs = require('fs');
const jsdom = (() => {
  try { return require('jsdom'); } catch(e) { return null; }
})();

console.log('--- Verifying public/admin.html ---');
const adminHtml = fs.readFileSync('public/admin.html', 'utf8');

// 1. Verify 5 jogos in strip HTML
const stripMatch = adminHtml.match(/data-date="2026-11-03"[\s\S]*?<\/div>/);
console.log('1. Strip card for 2026-11-03:');
if (stripMatch) {
  const cardText = stripMatch[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  console.log('   Text:', cardText);
  if (cardText.includes('5 jogos')) {
    console.log('   ✓ CONFIRMED: 03 Nov shows "5 jogos" in calendar strip');
  } else {
    console.error('   ❌ ERROR: 03 Nov does not show "5 jogos"!');
  }
} else {
  console.error('   ❌ Card for 2026-11-03 not found!');
}

// 2. Verify fallback has 5 games
const fbMatch = adminHtml.match(/Fallback garantido para terça-feira 03\/11\/2026[\s\S]*?\];/);
if (fbMatch) {
  const matchesInFb = (fbMatch[0].match(/id:\s*['"][^'"]+['"]/g) || []).length;
  console.log(`2. Fallback matches count: ${matchesInFb}`);
  if (matchesInFb === 5) {
    console.log('   ✓ CONFIRMED: 5 matches in fallback array for 03/11/2026');
  } else {
    console.error('   ❌ ERROR: Fallback array does not have 5 matches!');
  }
}

// 3. Verify Realtime sync and interval
console.log('3. Realtime & Auto-Sync:');
const hasRealtime = adminHtml.includes('setupArenaRealtimeSync()') && adminHtml.includes('arena_live_system_sync');
const hasInterval7s = adminHtml.includes('7000');
const hasPullCourts = adminHtml.includes('pullCourtsFromCloud');
const hasBackup = adminHtml.includes('downloadCompleteBackup');

console.log('   Realtime active:', hasRealtime ? '✓' : '❌');
console.log('   Polling 7s interval:', hasInterval7s ? '✓' : '❌');
console.log('   pullCourtsFromCloud:', hasPullCourts ? '✓' : '❌');
console.log('   downloadCompleteBackup:', hasBackup ? '✓' : '❌');
