const fs = require('fs');

const path = 'public/admin.html';
let content = fs.readFileSync(path, 'utf-8');

// 1. Atualizar o HTML da Legenda do Modal para incluir [Passado] e [Ocupado (Nome)]
const oldLegend = `          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="inline-flex items-center gap-1 text-slate-600 font-semibold">
              <span class="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-400"></span> Disponível
            </span>
            <span class="inline-flex items-center gap-1 text-slate-700 font-bold">
              <span class="w-2.5 h-2.5 rounded-sm bg-emerald-600 border border-emerald-700"></span> Selecionado
            </span>
            <span id="balcaoOccupiedLegend" class="inline-flex items-center gap-1 text-slate-400 font-medium">
              <span class="w-2.5 h-2.5 rounded-sm bg-slate-200 border border-slate-300"></span> Ocupado
            </span>
          </div>`;

const newLegend = `          <div class="flex items-center gap-2 flex-wrap text-[10px]">
            <span class="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
              <span class="w-2 h-2 rounded-xs bg-emerald-500"></span> Livre
            </span>
            <span class="inline-flex items-center gap-1 text-emerald-900 font-black bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-600">
              <span class="w-2 h-2 rounded-xs bg-emerald-700"></span> Selecionado
            </span>
            <span class="inline-flex items-center gap-1 text-rose-800 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300">
              <span class="w-2 h-2 rounded-xs bg-rose-500"></span> Ocupado (Nome)
            </span>
            <span class="inline-flex items-center gap-1 text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
              <span class="w-2 h-2 rounded-xs bg-slate-400"></span> Horário Passado
            </span>
          </div>`;

if (!content.includes(oldLegend)) {
  console.error('ERROR: oldLegend not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldLegend, newLegend);
console.log('✓ Successfully replaced modal legend');

// 2. Atualizar o trecho de renderização em renderBalcaoTimeSlots
const oldLoop = `      if (isOccupied) {
        html += '<button type="button" disabled data-slot-min="' + m + '" title="Ocupado: ' + conflict.name + ' (' + conflict.startStr + ' às ' + conflict.endStr + ')" class="p-2 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 line-through text-center flex flex-col items-center justify-center select-none">';
        html += '<span class="font-bold">' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9px] uppercase tracking-tighter truncate max-w-[55px]">' + conflict.name + '</span>';
        html += '</button>';
      } else if (isPast) {
        html += '<button type="button" disabled data-slot-min="' + m + '" title="Horário já passado" class="p-2 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-50 text-center flex flex-col items-center justify-center select-none">';
        html += '<span class="font-bold">' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9px] uppercase tracking-tighter">Passado</span>';
        html += '</button>';`;

const newLoop = `      if (isOccupied) {
        const agendadoPor = conflict.name || 'Ocupado';
        const tipoLabel = conflict.type ? ' (' + conflict.type + ')' : '';
        html += '<button type="button" disabled data-slot-min="' + m + '" title="Agendado: ' + agendadoPor + tipoLabel + ' [' + conflict.startStr + ' às ' + conflict.endStr + ']" class="p-2 rounded-xl text-[11px] font-bold bg-rose-50/90 text-rose-800 border-2 border-rose-300 shadow-2xs cursor-not-allowed opacity-90 text-center flex flex-col items-center justify-center select-none hover:bg-rose-100 transition-colors">';
        html += '<span class="font-black text-rose-950">' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9px] font-black uppercase tracking-tight text-rose-700 bg-rose-200/80 px-1.5 py-0.5 rounded truncate max-w-[70px] w-full block shadow-3xs" title="' + agendadoPor + '">' + agendadoPor + '</span>';
        html += '</button>';
      } else if (isPast) {
        html += '<button type="button" disabled data-slot-min="' + m + '" title="Horário já passou do relógio atual" class="p-2 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-400 border border-slate-300 cursor-not-allowed opacity-65 text-center flex flex-col items-center justify-center select-none">';
        html += '<span class="font-extrabold text-slate-500">' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-200/90 px-1 py-0.5 rounded shadow-3xs">Passado</span>';
        html += '</button>';`;

if (!content.includes(oldLoop)) {
  console.error('ERROR: oldLoop not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldLoop, newLoop);
console.log('✓ Successfully enhanced occupied and past slot display with booking titular/team');

// 3. Atualizar a mensagem quando nenhum horário estiver visível
const oldEmptyMsg = `Todos os horários desta quadra estão ocupados para esta data. Desmarque a opção "Ocultar Indisponíveis" para ver a grade completa.`;
const newEmptyMsg = `Nenhum horário livre restante nesta quadra para esta data. Desmarque a opção "Ocultar Indisponíveis" acima para ver todos os horários e quem está agendado em cada um deles.`;

if (content.includes(oldEmptyMsg)) {
  content = content.replace(oldEmptyMsg, newEmptyMsg);
  console.log('✓ Successfully updated empty slots guidance message');
}

fs.writeFileSync(path, content, 'utf-8');
console.log(' ALL UPDATES APPLIED TO public/admin.html');
