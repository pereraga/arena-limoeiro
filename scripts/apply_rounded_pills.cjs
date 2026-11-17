const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let code = fs.readFileSync(path, 'utf8');

// 1. In balcaoScheduledGamesContainer: when occupiedRanges.length === 0, hide container
// Let's check where balcaoScheduledGamesContainer is styled or updated:
// In admin.html:
// if (gamesContainerEl) {
//   if (occupiedRanges.length === 0) {
//     gamesContainerEl.style.display = 'none';
// ...
// Let's also check if there is any other place showing "0 agendados" or "Nenhum jogo agendado nesta quadra".

console.log('Replacing slot button classes to rounded-2xl...');
// Replace slot button classes in the loop:
code = code.replaceAll('class="py-0.5 px-0.5 rounded-xl text-[8.5px]', 'class="py-0.5 px-0.5 rounded-2xl text-[8.5px]');

// Replace court pills to rounded-2xl:
code = code.replaceAll('court-pill-btn active-court-pill shrink-0 px-3 py-1.5 rounded-xl', 'court-pill-btn active-court-pill shrink-0 px-3 py-1.5 rounded-2xl');
code = code.replaceAll('court-pill-btn active-court-pill shrink-0 px-3.5 py-1.5 rounded-xl', 'court-pill-btn active-court-pill shrink-0 px-3.5 py-1.5 rounded-2xl');
code = code.replaceAll('court-pill-btn shrink-0 px-3 py-1.5 rounded-xl', 'court-pill-btn shrink-0 px-3 py-1.5 rounded-2xl');

// In Gestão de Espaços buttons:
code = code.replaceAll('class="p-2 rounded-xl bg-slate-100 text-slate-700 transition"', 'class="p-2 rounded-2xl bg-slate-100 text-slate-700 transition"');

fs.writeFileSync(path, code, 'utf8');
console.log('Replacements done successfully!');
