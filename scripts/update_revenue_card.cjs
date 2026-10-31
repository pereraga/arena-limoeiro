const fs = require('fs');

let appJs = fs.readFileSync('public/app.js', 'utf8');

// Atualizar o card de "Faturamento Previsto" para exibir a indicação clara do dia selecionado
const oldRevenueCard = `        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <i data-lucide="dollar-sign" class="w-6 h-6 text-emerald-700"></i>
          </div>
          <div>
            <span class="text-[11px] font-bold text-slate-500 uppercase block">Faturamento Previsto</span>
            <div class="text-lg sm:text-xl font-black text-slate-900">R$ \${totalRevenue.toFixed(2).replace('.', ',')}</div>
          </div>
        </div>`.replace(/\n/g, '\r\n');

const newRevenueCard = `        <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3 sm:space-x-4">
          <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <i data-lucide="dollar-sign" class="w-6 h-6 text-emerald-700"></i>
          </div>
          <div>
            <span class="text-[11px] font-bold text-slate-500 uppercase block">Faturamento Previsto \${isSelectedDateToday ? '(Hoje)' : '(' + formatDisplayDate(selectedDate) + ')'}</span>
            <div class="text-lg sm:text-xl font-black text-slate-900">R$ \${totalRevenue.toFixed(2).replace('.', ',')}</div>
          </div>
        </div>`.replace(/\n/g, '\r\n');

if (appJs.includes(oldRevenueCard)) {
  appJs = appJs.replace(oldRevenueCard, newRevenueCard);
  console.log('✅ Card de Faturamento Previsto atualizado com sucesso!');
} else {
  console.log('❌ Trecho oldRevenueCard não encontrado exatamente');
}

fs.writeFileSync('public/app.js', appJs, 'utf8');
console.log('Arquivo salvo com sucesso!');
