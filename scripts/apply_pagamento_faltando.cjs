const fs = require('fs');

const adminPath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(adminPath, 'utf8');

console.log('[1/5] Atualizando auto-expire para registrar "Pagamento Faltando"...');

// 1. checkAndAutoExpireMatches
const oldAutoExpireAvulso = `// AVULSO: Cancela automaticamente por falta de pagamento / não comparecimento
            g.status = 'cancelled';
            g.attendance = 'Cancelado por falta de pagamento';
            g.payment_status = 'não_pago';
            g.observation = 'Cancelado automaticamente após o horário - Falta de pagamento';
            if (typeof window.addMatchLog === 'function') {
              window.addMatchLog(g, 'Cancelamento Automático (' + (m.end_time || '') + ')', 'Horário limite excedido sem confirmação de pagamento. Jogo cancelado automaticamente.');
            }
            console.log('[AutoExpire] Jogo avulso ' + (g.customer_name || g.name) + ' cancelado automaticamente por falta de pagamento!');`;

const newAutoExpireAvulso = `// AVULSO: Registra como Pagamento Faltando após término do horário
            g.status = 'unpaid';
            g.attendance = 'Pagamento Faltando';
            g.payment_status = 'pagamento_faltando';
            g.observation = 'Horário encerrado • Pagamento Faltando';
            if (!g.payment || g.payment === 'Pendente') g.payment = 'Pagamento Faltando';
            if (typeof window.addMatchLog === 'function') {
              window.addMatchLog(g, 'Fim do Horário (' + (m.end_time || '') + ')', 'Horário de jogo encerrado. Pagamento não registrado (Pagamento Faltando).');
            }
            console.log('[AutoExpire] Jogo avulso ' + (g.customer_name || g.name) + ' registrado com Pagamento Faltando!');`;

if (content.includes(oldAutoExpireAvulso)) {
  content = content.replace(oldAutoExpireAvulso, newAutoExpireAvulso);
  console.log('✓ checkAndAutoExpireMatches atualizado para "Pagamento Faltando"!');
} else {
  console.error('❌ oldAutoExpireAvulso não encontrado!');
  process.exit(1);
}

console.log('[2/5] Atualizando o <select id="movementStatusFilter">...');

// 2. Select HTML
const oldSelect = `<option value="everything">👁 Exibir Todas (Com Finalizadas e Canceladas)</option>
                <option value="cancelled">🚫 Cancelados / Falta de Pagamento</option>`;

const newSelect = `<option value="everything">👁 Exibir Todas (Com Finalizadas)</option>
                <option value="unpaid">⚠️ Pagamento Faltando</option>`;

if (content.includes(oldSelect)) {
  content = content.replace(oldSelect, newSelect);
  console.log('✓ Select de status atualizado com "⚠️ Pagamento Faltando"!');
} else {
  console.error('❌ oldSelect não encontrado!');
  process.exit(1);
}

console.log('[3/5] Atualizando títulos e filtros em renderMovementMatches...');

// 3.1 Títulos do feed
const oldTitle = `} else if (statusFilter === 'everything') {
        titleEl.innerHTML = 'Todas as Partidas (Ativas, Concluídas e Sem Pagamento) de ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-bold ml-2">Geral (' + allMatches.length + ')</span>';
      } else if (statusFilter === 'cancelled') {
        titleEl.innerHTML = 'Partidas Canceladas / Falta de Pagamento de ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-bold ml-2">Sem Pagamento</span>';`;

const newTitle = `} else if (statusFilter === 'everything') {
        titleEl.innerHTML = 'Todas as Partidas de ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-bold ml-2">Geral (' + allMatches.length + ')</span>';
      } else if (statusFilter === 'unpaid' || statusFilter === 'cancelled') {
        titleEl.innerHTML = 'Partidas com Pagamento Faltando em ' + formatDisplayDate(dateStr) + ' <span class="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold ml-2">Pagamento Faltando</span>';`;

if (content.includes(oldTitle)) {
  content = content.replace(oldTitle, newTitle);
  console.log('✓ Títulos de status do feed atualizados!');
} else {
  console.error('❌ oldTitle não encontrado!');
  process.exit(1);
}

// 3.2 Filtro de matches por statusFilter
const oldFilter = `} else if (statusFilter === 'everything') {
      // Exibe TODAS as partidas do dia (incluindo finalizadas e avulsos cancelados/sem pagamento)
      // Não remove os cancelados aqui para o usuário conseguir ver o histórico completo
    } else if (statusFilter === 'cancelled') {
      // Exibe apenas partidas canceladas / com falta de pagamento
      matches = matches.filter(m => m.status === 'cancelled' || m.status === 'no-show');
    } else {
      // Padrão (all): Partidas ativas (oculta finalizadas e canceladas)
      matches = matches.filter(m => m.status !== 'finished' && m.status !== 'cancelled');
    }`;

const newFilter = `} else if (statusFilter === 'everything') {
      // Exibe TODAS as partidas do dia (ativas, finalizadas e com pagamento faltando)
    } else if (statusFilter === 'unpaid' || statusFilter === 'cancelled') {
      // Exibe exclusivamente partidas avulsas cujo pagamento está faltando
      matches = matches.filter(m => m.status === 'unpaid' || m.status === 'cancelled' || m.payment_status === 'pagamento_faltando' || (m.observation && m.observation.includes('Pagamento Faltando')));
    } else {
      // Padrão (all): Partidas ativas do momento (oculta finalizadas)
      matches = matches.filter(m => m.status !== 'finished');
    }`;

if (content.includes(oldFilter)) {
  content = content.replace(oldFilter, newFilter);
  console.log('✓ Filtro de status atualizado com sucesso!');
} else {
  console.error('❌ oldFilter não encontrado!');
  process.exit(1);
}

console.log('[4/5] Atualizando calcMatchTimer...');

const oldTimerCancelled = `if (st === 'cancelled') {
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

const newTimerCancelled = `if (st === 'unpaid' || st === 'cancelled') {
      return {
        percent: 100,
        label: 'Horário encerrado • Pagamento Faltando',
        counter: 'Pagamento Faltando',
        fillClass: 'timer-fill-warn',
        badgeClass: 'timer-overdue',
        isOverdue: false,
        isFuture: false
      };
    }`;

if (content.includes(oldTimerCancelled)) {
  content = content.replace(oldTimerCancelled, newTimerCancelled);
  console.log('✓ calcMatchTimer atualizado!');
} else {
  console.error('❌ oldTimerCancelled não encontrado!');
  process.exit(1);
}

console.log('[5/5] Atualizando renderMatchCardHtml (Badges, textos e botões)...');

// 5.1 Card status badges & labels
const oldCardStatus = `} else if (st === 'cancelled') {
      const isAutoLackPay = (m.observation && m.observation.includes('Falta de pagamento')) || (m.attendance && m.attendance.includes('falta de pagamento'));
      statusBadgeClass = 'bg-rose-50 text-rose-700 border border-rose-200';
      statusIcon = 'fa-ban';
      statusLabel = isAutoLackPay ? 'Cancelado (Falta de Pagamento)' : 'Cancelado';
      statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-rose-600';
      statusInlineText = isAutoLackPay ? 'Partida Cancelada automaticamente • Falta de Pagamento' : 'Partida Cancelada';
      statusInlineTextColor = 'text-rose-700';`;

const newCardStatus = `} else if (st === 'unpaid' || st === 'cancelled') {
      statusBadgeClass = 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold';
      statusIcon = 'fa-triangle-exclamation';
      statusLabel = 'Pagamento Faltando';
      statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-amber-600';
      statusInlineText = '⚠️ Horário encerrado • Pagamento Faltando';
      statusInlineTextColor = 'text-amber-800 font-bold';`;

if (content.includes(oldCardStatus)) {
  content = content.replace(oldCardStatus, newCardStatus);
  console.log('✓ Card status classes atualizadas para "Pagamento Faltando"!');
} else {
  console.error('❌ oldCardStatus não encontrado!');
  process.exit(1);
}

// 5.2 Botão do card
const oldCardButton = `\${st === 'cancelled' ? \`
                <div class="flex items-center gap-2">
                  <span class="px-4 py-2 rounded-xl text-xs font-bold text-rose-800 bg-rose-100 border border-rose-300 shadow-sm inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-ban text-rose-600"></i> Cancelado (Falta de Pagamento)
                  </span>
                </div>`;

const newCardButton = `\${(st === 'unpaid' || st === 'cancelled') ? \`
                <div class="flex items-center gap-2">
                  <span class="px-4 py-2 rounded-xl text-xs font-extrabold text-amber-900 bg-amber-100 border border-amber-300 shadow-sm inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-triangle-exclamation text-amber-700"></i> Pagamento Faltando
                  </span>
                  <button type="button" onclick="openFinishGame('\${m.id}')" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer inline-flex items-center gap-1.5" title="Registrar Pagamento Agora">
                    <i class="fa-solid fa-hand-holding-dollar text-xs"></i> Registrar Pgto
                  </button>
                </div>`;

if (content.includes(oldCardButton)) {
  content = content.replace(oldCardButton, newCardButton);
  console.log('✓ Botão do card atualizado com botão para "Registrar Pgto"!');
} else {
  console.error('❌ oldCardButton não encontrado!');
  process.exit(1);
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('✔ public/admin.html atualizado com sucesso!');
