const fs = require('fs');
const jsdom = (() => {
  try { return require('jsdom'); } catch(e) { return null; }
})();

console.log('Testing DOM Filter Simulation...');

// Simple test to verify regex/functions in admin.html
const html = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html', 'utf8');

const checks = [
  { name: 'movementFilterPills present in HTML', ok: html.includes('id="movementFilterPills"') },
  { name: 'pillFilterActive button present', ok: html.includes('id="pillFilterActive"') },
  { name: 'pillFilterFinished button present', ok: html.includes('id="pillFilterFinished"') },
  { name: 'pillFilterLive button present', ok: html.includes('id="pillFilterLive"') },
  { name: 'pillFilterEverything button present', ok: html.includes('id="pillFilterEverything"') },
  { name: 'setMovementQuickFilter defined', ok: html.includes('window.setMovementQuickFilter = function(status)') },
  { name: 'pullDataFromCloudDatabases used in initAdminGames', ok: html.includes('window.pullDataFromCloudDatabases();') && !html.includes("fetch('https://aukrcnhuyultkjqsgvea.supabase.co/rest/v1/bookings?select=*&order=date.desc'") },
  { name: 'idx_bookings_date_status in migration', ok: fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/supabase/migrations/20261103_rls_hardening.sql', 'utf8').includes('idx_bookings_date_status') }
];

let allOk = true;
checks.forEach(c => {
  console.log(`[${c.ok ? 'PASS' : 'FAIL'}] ${c.name}`);
  if (!c.ok) allOk = false;
});

if (!allOk) {
  process.exit(1);
} else {
  console.log('\n✅ All filter & architecture checks PASSED!');
}
