const fs = require('fs');

console.log('Testing DOM Filter Simulation (Clean Mode)...');

const html = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html', 'utf8');

const checks = [
  { name: 'movementFilterPills successfully REMOVED', ok: !html.includes('id="movementFilterPills"') },
  { name: 'pillFilterFinished successfully REMOVED', ok: !html.includes('id="pillFilterFinished"') },
  { name: 'movementStatusFilter select present', ok: html.includes('id="movementStatusFilter"') },
  { name: 'filterMovementMatches defined', ok: html.includes('window.filterMovementMatches = function()') },
  { name: 'finished option present in select', ok: html.includes('value="finished">✅ Finalizados / Concluídos</option>') },
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
  console.log('\n✅ All clean filter & architecture checks PASSED!');
}
