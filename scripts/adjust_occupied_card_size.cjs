const fs = require('fs');

const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(path, 'utf8');

// Alvo exato no renderBalcaoTimeSlots
const targetOld = `        const intervalStr = conflict.startStr + ' às ' + conflict.endStr;
        html += '<button type="button" data-slot-min="' + m + '" onclick="window.showBalcaoOccupiedDetail(\\'' + safeNomeJson + '\\', \\'' + slotTime + '\\', \\'' + safeHorarioJson + '\\', \\'' + safeTipoJson + '\\')" title="Agendado: ' + agendadoPorCompleto + ' (' + tipoLabel + ') [' + intervalStr + '] - Toque para ver detalhes" class="p-1.5 sm:p-2 rounded-xl text-[11px] font-bold bg-rose-100 text-rose-950 border-2 border-rose-500 shadow-xs cursor-pointer text-center flex flex-col items-center justify-center select-none hover:bg-rose-200 hover:border-rose-600 active:scale-95 transition-all">';
        html += '<span class="font-black text-rose-950 text-xs">' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9.5px] font-black uppercase tracking-tight text-rose-900 bg-rose-200 px-1 py-0.5 rounded truncate max-w-full w-full block shadow-3xs" title="' + agendadoPorCompleto + ' (' + intervalStr + ')">' + nomeExibicao + '</span>';
        html += '<span class="text-[8px] font-bold text-rose-700 leading-tight block">' + intervalStr + '</span>';
        html += '</button>';`;

// Nova versão:
// - Remove o span com o intervalStr ('15:30 às 16:30' que estava quebrando em 2 linhas e espremendo o quadrado)
// - Ajusta o nome do titular para ficar perfeitamente legível e proporcional ao tamanho do quadrado
//   (com fonte nítida, padding adequado, truncate limpo sem estourar e visual limpo)
const replacementNew = `        const intervalStr = conflict.startStr + ' às ' + conflict.endStr;
        html += '<button type="button" data-slot-min="' + m + '" onclick="window.showBalcaoOccupiedDetail(\\'' + safeNomeJson + '\\', \\'' + slotTime + '\\', \\'' + safeHorarioJson + '\\', \\'' + safeTipoJson + '\\')" title="Agendado: ' + agendadoPorCompleto + ' (' + tipoLabel + ') [' + intervalStr + '] - Toque para ver detalhes" class="p-2 min-h-[60px] rounded-xl text-[11px] font-bold bg-rose-100 hover:bg-rose-200 text-rose-950 border-2 border-rose-500 shadow-xs cursor-pointer text-center flex flex-col items-center justify-center gap-1 select-none active:scale-95 transition-all overflow-hidden">';
        html += '<span class="font-black text-rose-950 text-xs leading-none">' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[10px] font-black uppercase tracking-tight text-rose-900 bg-rose-200/90 px-1.5 py-0.5 rounded-md truncate max-w-full w-full block shadow-3xs leading-tight" title="' + agendadoPorCompleto + ' (' + intervalStr + ')">' + nomeExibicao + '</span>';
        html += '</button>';`;

if (!content.includes(targetOld)) {
  console.error('Error: targetOld not found in admin.html!');
  process.exit(1);
}

content = content.replace(targetOld, replacementNew);
fs.writeFileSync(path, content, 'utf8');
console.log('Successfully adjusted occupied button layout in admin.html!');
