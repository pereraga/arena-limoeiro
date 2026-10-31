const fs = require('fs');

let appJs = fs.readFileSync('public/app.js', 'utf8');

// 1. No calendário (botão do dia): remover a coroa 👑 quando selecionado e quando fixo
const oldSelectedDayLabel = `\${isSelected ? '<span class="text-[9px] font-black uppercase tracking-wider text-emerald-100 leading-none mt-0.5">✓' + (fixosThisDay.length > 0 ? ' 👑' : '') + '</span>' : 
          isToday ? '<span class="text-[9px] font-extrabold text-emerald-700 leading-none mt-0.5">Hoje</span>' : 
          fixosThisDay.length > 0 ? '<span class="text-[8px] font-black text-amber-700 leading-none mt-0.5 flex items-center">👑 Fixo</span>' :
          isWeekend ? '<span class="w-1 h-1 rounded-full bg-emerald-500 mt-0.5"></span>' : ''}`.replace(/\n/g, '\r\n');

const newSelectedDayLabel = `\${isSelected ? '<span class="text-[9px] font-black uppercase tracking-wider text-emerald-100 leading-none mt-0.5">✓</span>' : 
          isToday ? '<span class="text-[9px] font-extrabold text-emerald-700 leading-none mt-0.5">Hoje</span>' : 
          fixosThisDay.length > 0 ? '<span class="text-[8px] font-black text-amber-700 leading-none mt-0.5 flex items-center">Fixo</span>' :
          isWeekend ? '<span class="w-1 h-1 rounded-full bg-emerald-500 mt-0.5"></span>' : ''}`.replace(/\n/g, '\r\n');

if (appJs.includes(oldSelectedDayLabel)) {
  appJs = appJs.replace(oldSelectedDayLabel, newSelectedDayLabel);
  console.log('✅ Coroa removida dos botões de dia no calendário!');
} else {
  console.log('❌ oldSelectedDayLabel não encontrado');
}

// 2. Na legenda da Grade de Horários:
const oldLegendaFixo = `<span class="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full">
            <span class="text-xs">👑</span> Horário Fixo (Mensalista)
          </span>`.replace(/\n/g, '\r\n');

const newLegendaFixo = `<span class="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Horário Fixo (Mensalista)
          </span>`.replace(/\n/g, '\r\n');

if (appJs.includes(oldLegendaFixo)) {
  appJs = appJs.replace(oldLegendaFixo, newLegendaFixo);
  console.log('✅ Coroa substituída na legenda da grade de horários!');
} else {
  console.log('❌ oldLegendaFixo não encontrado');
}

// 3. Nos slots da Grade de Horários (isMensalista):
const oldSlotFixo = `                  badge = '<span class="text-[8px] xs:text-[8.5px] font-black bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded-md border border-amber-300 inline-flex items-center justify-center gap-1 whitespace-nowrap truncate max-w-full">👑 Horário Fixo</span>';
                  icon = '👑';`.replace(/\n/g, '\r\n');

const newSlotFixo = `                  badge = '<span class="text-[8px] xs:text-[8.5px] font-black bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded-md border border-amber-300 inline-flex items-center justify-center gap-1 whitespace-nowrap truncate max-w-full">Horário Fixo</span>';
                  icon = '🔒';`.replace(/\n/g, '\r\n');

if (appJs.includes(oldSlotFixo)) {
  appJs = appJs.replace(oldSlotFixo, newSlotFixo);
  console.log('✅ Coroa removida dos slots de horário fixo!');
} else {
  console.log('❌ oldSlotFixo não encontrado');
}

fs.writeFileSync('public/app.js', appJs, 'utf8');
console.log('Arquivo salvo com sucesso!');
