const fs = require('fs');

let appJs = fs.readFileSync('public/app.js', 'utf8');

// Bloco 2: O box escuro com borda esmeralda em Step 2 (topo da seleção de data)
const block2 = `        \${(() => {
          const courtFixos = getCourtFixedMembers(court.id);
          if (courtFixos.length === 0) return '';
          return \`
            <div class="mt-3.5 pt-3 border-t border-emerald-800/60">
              <div class="flex items-center space-x-1.5 text-xs font-black text-amber-400 uppercase mb-2">
                <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-400"></i>
                <span>HORÁRIOS FIXOS DESTE CAMPO:</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                \${courtFixos.map(m => {
                  const teamName = m.team_name || m.teamName || 'Mensalista';
                  const dayLabel = m.day_of_week_label || m.dayOfWeekLabel || (m.day_of_week ? 'Toda ' + m.day_of_week + '-feira' : 'Semanal');
                  const time = m.time || m.start_time || m.startTime || '19:00';
                  return \`
                    <div class="text-xs font-medium text-emerald-100 bg-black/40 px-3 py-2 rounded-xl border border-emerald-500/30 flex items-center space-x-2">
                      <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                      <strong class="text-white truncate">• \${teamName}</strong>
                      <span class="text-emerald-300 text-[11px] truncate">(\${dayLabel} \${time})</span>
                    </div>
                  \`;
                }).join('')}
              </div>
            </div>
          \`;
        })()}`.replace(/\n/g, '\r\n');

// Bloco 3: O banner amarelo com badge FIXO acima do calendário de dias
const block3 = `    <!-- BANNER DE HORÁRIOS FIXOS DESTE CAMPO: EXIBIÇÃO CLARA NA ÁREA DE AGENDAMENTO -->
    \${(() => {
      const courtFixos = getCourtFixedMembers(selectedCourtId);
      if (courtFixos.length === 0) return '';
      return \`
        <div class="mb-4 p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 text-amber-950 shadow-xs">
          <div class="flex items-center justify-between mb-2 pb-1.5 border-b border-amber-200">
            <div class="flex items-center space-x-1.5 text-xs font-black text-amber-950 uppercase tracking-wide">
              <i data-lucide="crown" class="w-4 h-4 text-amber-600"></i>
              <span>HORÁRIOS FIXOS DESTE CAMPO:</span>
            </div>
            <span class="text-[10px] font-black bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full uppercase">
              \${courtFixos.length} \${courtFixos.length === 1 ? 'Horário Fixo' : 'Horários Fixos'}
            </span>
          </div>
          <div class="space-y-1.5">
            \${courtFixos.map(m => {
              const teamName = m.team_name || m.teamName || 'Mensalista';
              const dayLabel = m.day_of_week_label || m.dayOfWeekLabel || (m.day_of_week ? 'Toda ' + m.day_of_week + '-feira' : 'Semanal');
              const time = m.time || m.start_time || m.startTime || '19:00';
              return \`
                <div class="text-xs font-semibold text-slate-800 flex items-center justify-between bg-white/95 p-2.5 rounded-xl border border-amber-200 shadow-2xs">
                  <div class="flex items-center space-x-2 truncate">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <strong class="text-slate-900 truncate">• \${teamName}</strong>
                    <span class="text-slate-600 text-[11px] truncate">(\${dayLabel} às \${time})</span>
                  </div>
                  <span class="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md uppercase shrink-0">Fixo</span>
                </div>
              \`;
            }).join('')}
          </div>
          <p class="text-[10px] font-semibold text-amber-800 mt-2 flex items-center">
            <i data-lucide="info" class="w-3 h-3 mr-1 text-amber-600 shrink-0"></i>
            <span>Estes horários já possuem times mensalistas fixos e ficam indisponíveis nos dias da semana correspondentes.</span>
          </p>
        </div>
      \`;
    })()}`.replace(/\n/g, '\r\n');

if (appJs.includes(block2)) {
  appJs = appJs.replace(block2, '');
  console.log('✅ Bloco 2 (escuro) removido de public/app.js!');
} else {
  console.log('❌ Bloco 2 não encontrado exatamente');
}

if (appJs.includes(block3)) {
  appJs = appJs.replace(block3, '');
  console.log('✅ Bloco 3 (amarelo) removido de public/app.js!');
} else {
  console.log('❌ Bloco 3 não encontrado exatamente');
}

fs.writeFileSync('public/app.js', appJs, 'utf8');
console.log('Finalizado processamento de app.js.');
