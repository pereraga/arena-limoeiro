const fs = require('fs');

const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Atualizar o elemento HTML do resumo de horário selecionado
const oldHtml = `<div id="balcaoSlotSelectionSummary" class="text-xs font-bold text-emerald-900 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1.5">
            <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>Horário: <strong id="summarySelectedTime">Nenhum horário selecionado</strong> (<span id="summaryDuration">Toque abaixo</span>)</span>
          </div>`;

const newHtml = `<div id="balcaoSlotSelectionSummary" class="text-[11px] sm:text-xs font-bold text-emerald-900 bg-emerald-100/90 px-2.5 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1.5 flex-nowrap whitespace-nowrap overflow-hidden">
            <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i>
            <span class="truncate">Horário: <strong id="summarySelectedTime">Nenhum horário selecionado</strong> (<span id="summaryDuration">Toque abaixo</span>)</span>
          </div>`;

if (!content.includes(oldHtml)) {
  console.error('Error: oldHtml not found in admin.html!');
  process.exit(1);
}

content = content.replace(oldHtml, newHtml);
console.log('1. Updated HTML wrapper to whitespace-nowrap and responsive font size: SUCCESS');

fs.writeFileSync(path, content, 'utf8');
console.log('Finished updating admin.html');
