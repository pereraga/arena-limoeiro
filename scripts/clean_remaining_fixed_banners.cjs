const fs = require('fs');

let appJs = fs.readFileSync('public/app.js', 'utf8');

// 1. Remover a caixa informativa de horários fixos dentro do card "Dia Escolhido" (Step 2 Calendário)
const targetCalendarFixos = `      \${selectedDayFixos.length > 0 ? \`
        <div class="mt-3 pt-2.5 border-t border-emerald-200 text-xs">
          <div class="flex items-center space-x-1.5 font-black text-amber-900 uppercase text-[11px] mb-1.5">
            <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-600"></i>
            <span>Horários Fixos Ocupados neste dia da semana:</span>
          </div>
          <div class="space-y-1">
            \${selectedDayFixos.map(m => \`
              <div class="text-[11px] font-bold text-slate-800 flex items-center justify-between bg-amber-100/70 px-2.5 py-1.5 rounded-xl border border-amber-300">
                <div class="flex items-center space-x-1.5 truncate">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span class="text-amber-950 font-black">• \${m.team_name || m.teamName}</span>
                  <span class="text-slate-600">(\${m.time || m.start_time || m.startTime})</span>
                </div>
                <span class="text-[9px] font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md uppercase shrink-0">Reservado Fixo</span>
              </div>
            \`).join('')}
          </div>
        </div>
      \` : (state.selectedDate ? \`
        <div class="mt-2.5 pt-2 border-t border-emerald-200/80 flex items-center text-xs text-emerald-800 font-medium">
          <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0"></i>
          <span>Nenhum horário fixo recorrente neste dia da semana. Todos os horários livres estão disponíveis para você!</span>
        </div>
      \` : '')}`.replace(/\n/g, '\r\n');

if (appJs.includes(targetCalendarFixos)) {
  appJs = appJs.replace(targetCalendarFixos, '');
  console.log('✅ Bloco de horários fixos do calendário (Step 2) removido com sucesso!');
} else {
  console.log('❌ targetCalendarFixos não encontrado');
}

// 2. Remover o banner com lista de horários fixos de Step 3 (acima da grade de horários)
const targetStep3Banner = `      <!-- Horários Fixos deste Campo e Dia (Exibição para os Clientes) -->
      \${(() => {
        const courtFixos = getCourtFixedMembers(court.id);
        const [sy, sm, sd] = state.selectedDate ? state.selectedDate.split('-').map(Number) : [0, 0, 0];
        const sDOW = state.selectedDate ? new Date(sy, sm - 1, sd).getDay() : -1;
        const sDayName = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][sDOW];
        const sDayFixos = courtFixos.filter(m => normalizeDayOfWeek(m.day_of_week || m.dayOfWeek) === sDayName);
        if (sDayFixos.length === 0) return '';
        return \`
          <div class="mb-6 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-xs">
            <div class="flex items-center space-x-2 text-xs font-black text-amber-950 uppercase mb-1.5">
              <i data-lucide="crown" class="w-4 h-4 text-amber-600"></i>
              <span>👑 Horário Fixo Mensalista Reservado neste Dia:</span>
            </div>
            <p class="text-xs text-amber-900 mb-2.5">Os horários abaixo já pertencem a times mensalistas fixos e ficam destacados em dourado com a coroa 👑 na grade:</p>
            <div class="flex flex-wrap gap-2">
              \${sDayFixos.map(m => \`
                <div class="text-xs font-bold bg-white text-slate-800 px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs flex items-center space-x-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <strong class="text-slate-900">\${m.team_name || m.teamName}</strong>
                  <span class="text-slate-600 text-[11px]">(\${m.time || m.start_time || m.startTime})</span>
                  <span class="text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md uppercase">Fixo</span>
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
      })()}`.replace(/\n/g, '\r\n');

if (appJs.includes(targetStep3Banner)) {
  appJs = appJs.replace(targetStep3Banner, '');
  console.log('✅ Banner de horários fixos de Step 3 removido com sucesso!');
} else {
  console.log('❌ targetStep3Banner não encontrado');
}

fs.writeFileSync('public/app.js', appJs, 'utf8');
console.log('Arquivo salvo com sucesso!');
