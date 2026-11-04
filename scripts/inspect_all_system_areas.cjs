const fs = require('fs');

const adminPath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
const html = fs.readFileSync(adminPath, 'utf8');

const keywords = [
  'saveCourt', 'updateCourt', 'renderCourts',
  'saveMonthlyMember', 'deleteMonthly', 'renderCadastrosMonthly',
  'saveProduct', 'renderProducts',
  'saveDirectBooking', 'createDirectBooking',
  'saveCustomer', 'renderCustomers',
  'setInterval', 'supabase.channel'
];

keywords.forEach(kw => {
  const matches = [];
  const lines = html.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes(kw)) matches.push(`L${idx+1}: ${l.trim().slice(0, 100)}`);
  });
  console.log(`\n=== Keyword: ${kw} (${matches.length} occurrences) ===`);
  console.log(matches.slice(0, 5).join('\n'));
});
