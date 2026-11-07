const fs = require('fs');

const adminPath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(adminPath, 'utf8');

console.log('[1/4] Ajustando getMatchesForDate para carregar reservas canceladas/sem pagamento...');

// Localizar o loop de reservas no getMatchesForDate
const oldBookingLoop = `(window.adminGameState.bookings || []).forEach(b => {
      if (!b || b.status === 'cancelled') return;
      if (b.date === dateStr) {`;

const newBookingLoop = `(window.adminGameState.bookings || []).forEach(b => {
      if (!b) return;
      // Permite incluir reservas canceladas/sem pagamento para exibição nos filtros 'everything' e 'cancelled'
      if (b.date === dateStr) {`;

if (content.includes(oldBookingLoop)) {
  content = content.replace(oldBookingLoop, newBookingLoop);
  console.log('✓ Loop de reservas atualizado para não ignorar cancelados antecipadamente!');
} else {
  console.error('❌ oldBookingLoop não encontrado textualmente!');
  process.exit(1);
}

console.log('[2/4] Atualizando o <select id="movementStatusFilter">...');

// Atualizar o select de status
const oldSelectHtml = `<option value="everything">👁 Exibir Todas (Com Finalizadas)</option>`;
const newSelectHtml = `<option value="everything">👁 Exibir Todas (Com Finalizadas e Canceladas)</option>
                <option value="cancelled">🚫 Cancelados / Falta de Pagamento</option>`;

if (content.includes(oldSelectHtml)) {
  content = content.replace(oldSelectHtml, newSelectHtml);
  console.log('✓ Opção de Cancelados / Falta de Pagamento adicionada ao select!');
} else {
  console.error('❌ oldSelectHtml não encontrado!');
  process.exit(1);
}

console.log('[3/4] Atualizando a filtragem em renderMovementMatches...');

// 3.1 Atualizar o título do feed
const oldTitleCheck = `} else if (statusFilter === 'everything') {
        titleEl.innerHTML = 'Todas as Partidas (Ativas e Concluídas) de ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-bold ml-2">Geral (' + allMatches.length + ')</span>';`;

const newTitleCheck = `} else if (statusFilter === 'everything') {
        titleEl.innerHTML = 'Todas as Partidas (Ativas, Concluídas e Sem Pagamento) de ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-bold ml-2">Geral (' + allMatches.length + ')</span>';
      } else if (statusFilter === 'cancelled') {
        titleEl.innerHTML = 'Partidas Canceladas / Falta de Pagamento de ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-bold ml-2">Sem Pagamento</span>';`;

if (content.includes(oldTitleCheck)) {
  content = content.replace(oldTitleCheck, newTitleCheck);
  console.log('✓ Título do feed para "cancelled" e "everything" atualizado!');
} else {
  console.error('❌ oldTitleCheck não encontrado!');
  process.exit(1);
}

// 3.2 Atualizar o filtro de matches por statusFilter
const oldStatusMatchFilter = `} else if (statusFilter === 'everything') {
      // Exibe todas (com finalizadas)
      matches = matches.filter(m => m.status !== 'cancelled');
    } else {
      // Padrão (all): Partidas ativas (oculta finalizadas e canceladas)
      matches = matches.filter(m => m.status !== 'finished' && m.status !== 'cancelled');
    }`;

const newStatusMatchFilter = `} else if (statusFilter === 'everything') {
      // Exibe TODAS as partidas do dia (incluindo finalizadas e avulsos cancelados/sem pagamento)
      // Não remove os cancelados aqui para o usuário conseguir ver o histórico completo
    } else if (statusFilter === 'cancelled') {
      // Exibe apenas partidas canceladas / com falta de pagamento
      matches = matches.filter(m => m.status === 'cancelled' || m.status === 'no-show');
    } else {
      // Padrão (all): Partidas ativas (oculta finalizadas e canceladas)
      matches = matches.filter(m => m.status !== 'finished' && m.status !== 'cancelled');
    }`;

if (content.includes(oldStatusMatchFilter)) {
  content = content.replace(oldStatusMatchFilter, newStatusMatchFilter);
  console.log('✓ Lógica de filtragem de matches para statusFilter atualizada com sucesso!');
} else {
  console.error('❌ oldStatusMatchFilter não encontrado!');
  process.exit(1);
}

console.log('[4/4] Ajustando timer e botão principal para partidas canceladas...');

// 4.1 calcMatchTimer para st === 'cancelled'
const oldTimerFinished = `if (st === 'finished') {
      return {
        percent: 100,
        label: 'Partida concluída',
        counter: totalDuration + ' min finalizados',
        fillClass: 'timer-fill-finished',
        badgeClass: 'timer-finished',
        isOverdue: false,
        isFuture: false
      };
    }`;

const newTimerFinished = `if (st === 'finished') {
      return {
        percent: 100,
        label: 'Partida concluída',
        counter: totalDuration + ' min finalizados',
        fillClass: 'timer-fill-finished',
        badgeClass: 'timer-finished',
        isOverdue: false,
        isFuture: false
      };
    }

    if (st === 'cancelled') {
      return {
        percent: 100,
        label: 'Cancelado automaticamente • Falta de pagamento',
        counter: 'Cancelado',
        fillClass: 'timer-fill-red',
        badgeClass: 'timer-overdue',
        isOverdue: false,
        isFuture: false
      };
    }`;

if (content.includes(oldTimerFinished)) {
  content = content.replace(oldTimerFinished, newTimerFinished);
  console.log('✓ calcMatchTimer atualizado para status cancelado!');
} else {
  console.error('❌ oldTimerFinished não encontrado!');
  process.exit(1);
}

// 4.2 Botão principal no card para quando for cancelado
const oldButtonFinished = `<!-- BOTÃO PRINCIPAL VISÍVEL: VERDE PARA INICIAR -> APÓS APERTAR, FICA VERMELHO (FINALIZAR) -->
            <div class="w-full flex justify-end">
              \${st === 'finished' ? \`
                <div class="flex items-center gap-2">
                  <span class="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 shadow-sm inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-check text-emerald-600"></i> Finalizada
                  </span>
                  <button type="button" onclick="viewReceipt('\${m.id}')" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer inline-flex items-center gap-1" title="Ver Recibo">
                    <i class="fa-solid fa-receipt text-slate-500"></i> Recibo
                  </button>
                </div>
              \` : (isLive ? \``;

const newButtonFinished = `<!-- BOTÃO PRINCIPAL VISÍVEL: VERDE PARA INICIAR -> APÓS APERTAR, FICA VERMELHO (FINALIZAR) -->
            <div class="w-full flex justify-end">
              \${st === 'cancelled' ? \`
                <div class="flex items-center gap-2">
                  <span class="px-4 py-2 rounded-xl text-xs font-bold text-rose-800 bg-rose-100 border border-rose-300 shadow-sm inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-ban text-rose-600"></i> Cancelado (Falta de Pagamento)
                  </span>
                </div>
              \` : (st === 'finished' ? \`
                <div class="flex items-center gap-2">
                  <span class="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 shadow-sm inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-check text-emerald-600"></i> Finalizada
                  </span>
                  <button type="button" onclick="viewReceipt('\${m.id}')" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer inline-flex items-center gap-1" title="Ver Recibo">
                    <i class="fa-solid fa-receipt text-slate-500"></i> Recibo
                  </button>
                </div>
              \` : (isLive ? \``;

if (content.includes(oldButtonFinished)) {
  content = content.replace(oldButtonFinished, newButtonFinished);
  console.log('✓ Botão do card atualizado com badge de Cancelado (Falta de Pagamento)!');
} else {
  console.error('❌ oldButtonFinished não encontrado!');
  process.exit(1);
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('✔ public/admin.html atualizado com sucesso!');
