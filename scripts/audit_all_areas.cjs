const fs = require('fs');

const adminPath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(adminPath, 'utf8');

function checkSection(name, searchTerms) {
  console.log(`\n========================================`);
  console.log(`AREA: ${name}`);
  searchTerms.forEach(term => {
    let count = 0;
    const lines = html.split('\n');
    lines.forEach((l, idx) => {
      if (l.includes(term)) {
        count++;
        if (count <= 2) {
          console.log(`  [${term}] L${idx+1}: ${l.trim().slice(0, 110)}`);
        }
      }
    });
    console.log(`  Total for "${term}": ${count}`);
  });
}

checkSection('NOVA RESERVA BALCÃO', ['directBookingModal', 'saveDirectBooking', 'createBooking', 'syncBookingToCloud']);
checkSection('QUADRAS', ['panel-courts', 'syncCourtsToCloud', 'saveCourt', 'courtsListContainer', 'court-edit']);
checkSection('MENSALISTAS', ['panel-cadastros', 'monthlyMembers', 'addMonthlyMember', 'saveMonthly', 'deleteMonthly']);
checkSection('CLIENTES', ['customersListContainer', 'renderCustomers', 'saveCustomer', 'customersTable']);
checkSection('RELATÓRIOS', ['exportMovementDailyPDF', 'exportMovementDailyExcel', 'panel-reports']);
checkSection('SITE CLIENTE INDEX', ['confirmBooking', 'createBooking', 'bookingForm']);
