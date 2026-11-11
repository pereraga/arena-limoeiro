const fs = require('fs');

const path = 'public/admin.html';
let content = fs.readFileSync(path, 'utf-8');

// 1. Atualizar sysTodayStr em getMatchesForDate para ser dinâmico
const oldGetMatchesSysToday = `    // Regra: Finaliza todos os jogos dos dias anteriores (do dia 03 para trás)
    const sysTodayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08';
    const isPast = (dateStr < sysTodayStr);
    const defaultPastStatus = isPast ? 'finished' : 'confirmed';`;

const newGetMatchesSysToday = `    // Regra: Finaliza todos os jogos dos dias anteriores
    const sysTodayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : (function() {
      const nw = new Date();
      return nw.getFullYear() + '-' + String(nw.getMonth() + 1).padStart(2, '0') + '-' + String(nw.getDate()).padStart(2, '0');
    })();
    const isPast = (dateStr < sysTodayStr);
    const defaultPastStatus = isPast ? 'finished' : 'confirmed';`;

if (!content.includes(oldGetMatchesSysToday)) {
  console.error('ERROR: oldGetMatchesSysToday not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldGetMatchesSysToday, newGetMatchesSysToday);
console.log('✓ Successfully updated sysTodayStr in getMatchesForDate');

// 2. Substituir o trecho do nome do mensalista em getBalcaoOccupiedRanges
const oldMonthlyOccupied = `        if (!exists) {
          occupiedRanges.push({
            start: sm,
            end: effectiveEnd,
            startStr: formatMinutesToTime(sm),
            endStr: formatMinutesToTime(effectiveEnd),
            name: m.team_name || m.responsible_name || 'Mensalista Fixo',
            type: 'Mensalista Fixo',
            status: 'confirmed'
          });
        }`;

const newMonthlyOccupied = `        if (!exists) {
          // Captura o nome contratual completo e time do mensalista
          const respName = (m.responsible_name || '').trim();
          const tName = (m.team_name || '').trim();
          let contratualFullName = respName;
          if (tName && respName && tName.toLowerCase() !== respName.toLowerCase()) {
            contratualFullName = tName + ' (' + respName + ')';
          } else if (tName && !respName) {
            contratualFullName = tName;
          }
          if (!contratualFullName) contratualFullName = 'Mensalista Fixo';

          occupiedRanges.push({
            start: sm,
            end: effectiveEnd,
            startStr: formatMinutesToTime(sm),
            endStr: formatMinutesToTime(effectiveEnd),
            name: contratualFullName,
            responsibleName: respName,
            teamName: tName,
            phone: m.phone || '',
            type: 'Mensalista Fixo',
            status: 'confirmed'
          });
        }`;

if (!content.includes(oldMonthlyOccupied)) {
  console.error('ERROR: oldMonthlyOccupied not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldMonthlyOccupied, newMonthlyOccupied);
console.log('✓ Successfully updated monthly member occupied name in getBalcaoOccupiedRanges');

// 3. Atualizar a renderização dos botões de ocupado em renderBalcaoTimeSlots
const oldSlotOccupiedBtn = `      if (isOccupied) {
        const agendadoPor = conflict.name || 'Ocupado';
        const tipoLabel = conflict.type ? ' (' + conflict.type + ')' : '';
        html += '<button type="button" disabled data-slot-min="' + m + '" title="Agendado: ' + agendadoPor + tipoLabel + ' [' + conflict.startStr + ' às ' + conflict.endStr + ']" class="p-2 rounded-xl text-[11px] font-bold bg-rose-50/90 text-rose-800 border-2 border-rose-300 shadow-2xs cursor-not-allowed opacity-90 text-center flex flex-col items-center justify-center select-none hover:bg-rose-100 transition-colors">';
        html += '<span class="font-black text-rose-950">' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[9px] font-black uppercase tracking-tight text-rose-700 bg-rose-200/80 px-1.5 py-0.5 rounded truncate max-w-[70px] w-full block shadow-3xs" title="' + agendadoPor + '">' + agendadoPor + '</span>';
        html += '</button>';`;

const newSlotOccupiedBtn = `      if (isOccupied) {
        const agendadoPorCompleto = (conflict.name || 'Ocupado').trim();
        const tipoLabel = conflict.type ? conflict.type : 'Reserva';
        
        // Regra de Exibição Inteligente do Nome:
        // Se o nome for grande (> 8 caracteres), exibe o primeiro nome seguido de "..."
        // Exemplo: "José Carlos Silva" -> "José..."
        // Se for uma palavra só grande (> 8 caracteres) -> "Alexandr..."
        let nomeExibicao = agendadoPorCompleto;
        if (agendadoPorCompleto.length > 8) {
          const primeiroNome = agendadoPorCompleto.split(' ')[0].trim();
          if (primeiroNome.length > 0 && primeiroNome.length <= 8) {
            nomeExibicao = primeiroNome + '...';
          } else {
            nomeExibicao = agendadoPorCompleto.slice(0, 7) + '...';
          }
        }

        const safeNomeJson = agendadoPorCompleto.replace(/'/g, "\\\\'");
        const safeTipoJson = tipoLabel.replace(/'/g, "\\\\'");
        const safeHorarioJson = (conflict.startStr + ' às ' + conflict.endStr).replace(/'/g, "\\\\'");

        html += '<button type="button" data-slot-min="' + m + '" onclick="window.showBalcaoOccupiedDetail(\\'' + safeNomeJson + '\\', \\'' + slotTime + '\\', \\'' + safeHorarioJson + '\\', \\'' + safeTipoJson + '\\')" title="Agendado: ' + agendadoPorCompleto + ' (' + tipoLabel + ') [' + conflict.startStr + ' às ' + conflict.endStr + '] - Toque para ver detalhes" class="p-2 rounded-xl text-[11px] font-bold bg-rose-50/95 text-rose-900 border-2 border-rose-300 shadow-2xs cursor-pointer opacity-95 text-center flex flex-col items-center justify-center select-none hover:bg-rose-100 hover:border-rose-400 active:scale-95 transition-all">';
        html += '<span class="font-black text-rose-950">' + slotTime + '</span>';
        html += '<span class="balcao-slot-badge text-[10px] font-extrabold uppercase tracking-tight text-rose-700 bg-rose-200/90 px-1 py-0.5 rounded truncate max-w-[72px] w-full block shadow-3xs" title="' + agendadoPorCompleto + '">' + nomeExibicao + '</span>';
        html += '</button>';`;

if (!content.includes(oldSlotOccupiedBtn)) {
  console.error('ERROR: oldSlotOccupiedBtn not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldSlotOccupiedBtn, newSlotOccupiedBtn);
console.log('✓ Successfully enhanced occupied slot button with truncation and interactive click modal');

// 4. Inserir a função showBalcaoOccupiedDetail e closeBalcaoOccupiedDetail no JS
const oldToggleBalcao = `  // Alterna e define intervalos de horários com precisão pelo calendário
  const toggleBalcaoTimeSlot = window.toggleBalcaoTimeSlot = function(slotTime) {`;

const newToggleBalcao = `  // Modal interativo de visualização de agendamento ocupado ao tocar no slot
  window.showBalcaoOccupiedDetail = function(nomeCompleto, slotTime, horarioIntervalo, tipoAgendamento) {
    const modal = document.getElementById('modalDetalheOcupadoBalcao');
    if (!modal) {
      if (typeof arenaToast === 'function') {
        arenaToast('🔒 ' + slotTime + ' Ocupado por: ' + nomeCompleto + ' (' + tipoAgendamento + ' • ' + horarioIntervalo + ')');
      }
      return;
    }

    const nomeEl = document.getElementById('detalheOcupadoNomeCompleto');
    const horarioEl = document.getElementById('detalheOcupadoHorario');
    const intervaloEl = document.getElementById('detalheOcupadoIntervalo');
    const tipoEl = document.getElementById('detalheOcupadoTipo');

    if (nomeEl) nomeEl.textContent = nomeCompleto || 'Cliente Registrado';
    if (horarioEl) horarioEl.textContent = slotTime;
    if (intervaloEl) intervaloEl.textContent = horarioIntervalo || (slotTime + ' às ...');
    if (tipoEl) tipoEl.textContent = tipoAgendamento || 'Reserva Confirmada';

    modal.style.setProperty('display', 'flex', 'important');
    modal.classList.remove('hidden');
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  };

  window.closeBalcaoOccupiedDetail = function() {
    const modal = document.getElementById('modalDetalheOcupadoBalcao');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.add('hidden');
    }
  };

  // Alterna e define intervalos de horários com precisão pelo calendário
  const toggleBalcaoTimeSlot = window.toggleBalcaoTimeSlot = function(slotTime) {`;

if (!content.includes(oldToggleBalcao)) {
  console.error('ERROR: oldToggleBalcao not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldToggleBalcao, newToggleBalcao);
console.log('✓ Successfully injected showBalcaoOccupiedDetail and closeBalcaoOccupiedDetail');

// 5. Inserir o HTML do modalDetalheOcupadoBalcao
const targetModalAnchor = `<!-- Modal 1: Editar Jogo com Ajuste de Horário e Atraso -->`;
const newOccupiedModalHtml = `<!-- Modal Rápido: Detalhes do Horário Ocupado no Balcão -->
<div id="modalDetalheOcupadoBalcao" style="display:none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fade-in">
  <div class="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-rose-200 flex flex-col transform transition-all scale-100">
    <div class="bg-gradient-to-r from-rose-800 to-rose-950 p-4 text-white flex items-center justify-between">
      <div class="flex items-center space-x-2.5">
        <div class="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
          <i data-lucide="lock" class="w-4 h-4"></i>
        </div>
        <div>
          <h3 class="text-sm font-black tracking-tight uppercase">Horário Ocupado</h3>
          <p class="text-[10px] text-rose-200 font-medium">Informações da reserva / contrato</p>
        </div>
      </div>
      <button type="button" onclick="closeBalcaoOccupiedDetail()" class="text-rose-200 hover:text-white p-1 cursor-pointer">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    <div class="p-5 space-y-3.5 bg-slate-50/50">
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
        <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Nome Completo / Contrato:</span>
        <span id="detalheOcupadoNomeCompleto" class="text-base font-black text-slate-800 block break-words">--</span>
      </div>

      <div class="grid grid-cols-2 gap-2.5">
        <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Slot Clicado:</span>
          <span id="detalheOcupadoHorario" class="text-sm font-black text-rose-700 block">--:--</span>
        </div>
        <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Tipo:</span>
          <span id="detalheOcupadoTipo" class="text-xs font-black text-slate-700 block truncate">--</span>
        </div>
      </div>

      <div class="bg-rose-50 p-3 rounded-2xl border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
        <i data-lucide="clock" class="w-4 h-4 text-rose-600 shrink-0"></i>
        <span>Intervalo: <strong id="detalheOcupadoIntervalo" class="text-rose-950 font-black">--</strong></span>
      </div>

      <button type="button" onclick="closeBalcaoOccupiedDetail()" class="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-xs transition active:scale-98 cursor-pointer">
        Entendi, Fechar
      </button>
    </div>
  </div>
</div>

<!-- Modal 1: Editar Jogo com Ajuste de Horário e Atraso -->`;

if (!content.includes(targetModalAnchor)) {
  console.error('ERROR: targetModalAnchor not found in admin.html!');
  process.exit(1);
}
content = content.replace(targetModalAnchor, newOccupiedModalHtml);
console.log('✓ Successfully injected modalDetalheOcupadoBalcao markup');

fs.writeFileSync(path, content, 'utf-8');
console.log(' ALL OCCUPIED NAME AND MODAL FIXES APPLIED SUCCESSFULLY!');
