const fs = require('fs');
const path = require('path');

const adminPath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(adminPath, 'utf8');

console.log('[1/4] Removendo reset indesejado de 2026-11-04...');
const oldReset = `if (dateStr === '2026-11-04' && b.status === 'finished') {
          b.status = 'confirmed';
          b.observation = 'Pronto para iniciar';
        }`;

if (content.includes(oldReset)) {
  content = content.replace(oldReset, `// Manutenção de integridade: preserva status original finalizado ou cancelado`);
  console.log('✓ Reset de 2026-11-04 removido com sucesso!');
} else {
  console.log('⚠️ oldReset não encontrado textualmente, verificando variação...');
}

console.log('[2/4] Adicionando função checkAndAutoExpireMatches...');

const autoExpireFunction = `
  // =========================================================================
  // ENCERRAMENTO / CANCELAMENTO / FATURAMENTO AUTOMÁTICO APÓS O HORÁRIO
  // Regra do Usuário:
  // - Se passou do horário final da partida:
  //   * Avulso: Cancela automaticamente por falta de pagamento / não comparecimento
  //   * Mensalista / Fixo: Encerra automaticamente e registra cobrança no final do mês
  // =========================================================================
  window.checkAndAutoExpireMatches = function() {
    try {
      const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-04';
      const allTodayMatches = (typeof getMatchesForDate === 'function') ? getMatchesForDate(todayStr) : [];
      const now = new Date();
      const curM = now.getHours() * 60 + now.getMinutes();

      const parseMin = s => {
        if (!s) return 0;
        const p = s.split(':');
        return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
      };

      let hasChangedAny = false;

      allTodayMatches.forEach(m => {
        if (!m || m.status === 'finished' || m.status === 'cancelled') return;
        const sM = parseMin(m.start_time);
        let eM = parseMin(m.end_time);
        if (eM <= sM) eM += 24 * 60;
        const extraMin = Number(m.extraTime || m.extra_minutes || 0);
        const limitM = eM + extraMin;

        // Se o horário atual ultrapassou o término da partida
        if (curM > limitM) {
          const isMensalista = !!(m.isMensalista || m.type === 'Mensalista' || m.booking_type === 'mensalista' || String(m.id).startsWith('monthly-'));
          const g = (typeof window.getGame === 'function') ? window.getGame(m.id) : m;
          if (!g) return;

          if (isMensalista) {
            // MENSALISTA: Conclui o jogo e registra cobrança para o fechamento mensal
            g.status = 'finished';
            g.attendance = 'Finalizado (Fatura Mensal)';
            g.payment = 'Mensal';
            g.payment_method = 'Mensal';
            g.billing_status = 'cobrar_final_mes';
            g.finishedAt = m.end_time || '17:00';
            g.observation = 'Encerrado automaticamente após o horário • Cobrar no final do mês';
            if (typeof window.addMatchLog === 'function') {
              window.addMatchLog(g, 'Encerramento Automático (' + (m.end_time || '') + ')', 'Partida concluída automaticamente. Presença registrada para faturamento no final do mês.');
            }
            console.log('[AutoExpire] Mensalista ' + (g.customer_name || g.name) + ' encerrado e registrado para faturamento mensal!');
          } else {
            // AVULSO: Cancela automaticamente por falta de pagamento / não comparecimento
            g.status = 'cancelled';
            g.attendance = 'Cancelado por falta de pagamento';
            g.payment_status = 'não_pago';
            g.observation = 'Cancelado automaticamente após o horário - Falta de pagamento';
            if (typeof window.addMatchLog === 'function') {
              window.addMatchLog(g, 'Cancelamento Automático (' + (m.end_time || '') + ')', 'Horário limite excedido sem confirmação de pagamento. Jogo cancelado automaticamente.');
            }
            console.log('[AutoExpire] Jogo avulso ' + (g.customer_name || g.name) + ' cancelado automaticamente por falta de pagamento!');
          }

          if (typeof window.syncBookingToCloud === 'function') {
            window.syncBookingToCloud(g, 'upsert');
          }
          hasChangedAny = true;
        }
      });

      if (hasChangedAny) {
        try {
          localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
        } catch(e) {}
        if (typeof window.saveAdminGameState === 'function') window.saveAdminGameState();
        if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
        if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
      }
    } catch(err) {
      console.warn('[AutoExpire] Erro ao verificar encerramento automático:', err);
    }
  };
`;

// Inserir autoExpireFunction logo após checkAndAutoStartMatches
const autoStartTarget = `window.checkAndAutoStartMatches = function() {`;
if (content.includes(autoStartTarget)) {
  content = content.replace(autoStartTarget, autoExpireFunction + '\n  ' + autoStartTarget);
  console.log('✓ checkAndAutoExpireMatches inserido antes de checkAndAutoStartMatches!');
} else {
  console.error('❌ Falha ao localizar ponto de inserção de checkAndAutoStartMatches');
  process.exit(1);
}

console.log('[3/4] Atualizando chamadas em renderMovementMatches e __arenaFeedAutoInterval...');

// Adicionar chamada no início de renderMovementMatches
const renderMovementTarget = `// Auto-início de partidas que atingiram a tolerância de 5 min
    if (typeof window.checkAndAutoStartMatches === 'function') {
      window.checkAndAutoStartMatches();
    }`;

const renderMovementReplacement = `// Auto-início e auto-encerramento/cancelamento de partidas após o horário
    if (typeof window.checkAndAutoStartMatches === 'function') {
      window.checkAndAutoStartMatches();
    }
    if (typeof window.checkAndAutoExpireMatches === 'function') {
      window.checkAndAutoExpireMatches();
    }`;

if (content.includes(renderMovementTarget)) {
  content = content.replace(renderMovementTarget, renderMovementReplacement);
  console.log('✓ checkAndAutoExpireMatches adicionado em renderMovementMatches!');
} else {
  console.error('❌ Ponto de inserção em renderMovementMatches não encontrado!');
  process.exit(1);
}

// Adicionar chamada no loop contínuo __arenaFeedAutoInterval
const autoIntervalTarget = `// 2. Auto-início automático de partidas com tolerância de 5 min
      if (typeof window.checkAndAutoStartMatches === 'function') {
        window.checkAndAutoStartMatches();
      }`;

const autoIntervalReplacement = `// 2. Auto-início e auto-encerramento/cancelamento de partidas
      if (typeof window.checkAndAutoStartMatches === 'function') {
        window.checkAndAutoStartMatches();
      }
      if (typeof window.checkAndAutoExpireMatches === 'function') {
        window.checkAndAutoExpireMatches();
      }`;

if (content.includes(autoIntervalTarget)) {
  content = content.replace(autoIntervalTarget, autoIntervalReplacement);
  console.log('✓ checkAndAutoExpireMatches adicionado no loop __arenaFeedAutoInterval!');
} else {
  console.error('❌ Ponto de inserção no __arenaFeedAutoInterval não encontrado!');
  process.exit(1);
}

console.log('[4/4] Aprimorando exibição visual do card para mensalistas finalizados com cobrança final de mês...');

// No renderMatchCardHtml, quando status for finished ou cancelled, exibir observação específica
const cardStatusFinishedOld = `if (st === 'finished') {
      statusBadgeClass = 'bg-slate-100 text-slate-700 border border-slate-300';
      statusIcon = 'fa-circle-check';
      statusLabel = 'Finalizado';
      statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-slate-500';
      statusInlineText = '✓ Partida Finalizada com sucesso';
      statusInlineTextColor = 'text-slate-600';
    } else if (st === 'cancelled') {
      statusBadgeClass = 'bg-rose-50 text-rose-700 border border-rose-200';
      statusIcon = 'fa-ban';
      statusLabel = 'Cancelado';
      statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-rose-600';
      statusInlineText = 'Partida Cancelada';
      statusInlineTextColor = 'text-rose-700';`;

const cardStatusFinishedNew = `if (st === 'finished') {
      const isCobrarFinalMes = isMensalista || (m.billing_status === 'cobrar_final_mes') || (m.attendance && m.attendance.includes('Fatura Mensal'));
      statusBadgeClass = isCobrarFinalMes ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-slate-100 text-slate-700 border border-slate-300';
      statusIcon = isCobrarFinalMes ? 'fa-file-invoice-dollar' : 'fa-circle-check';
      statusLabel = isCobrarFinalMes ? 'Cobrar no Final do Mês' : 'Finalizado';
      statusInlineDot = isCobrarFinalMes ? 'w-2.5 h-2.5 rounded-full bg-purple-600' : 'w-2.5 h-2.5 rounded-full bg-slate-500';
      statusInlineText = isCobrarFinalMes ? '✓ Jogo Encerrado • Lançado para cobrança no final do mês' : '✓ Partida Finalizada com sucesso';
      statusInlineTextColor = isCobrarFinalMes ? 'text-purple-800 font-bold' : 'text-slate-600';
    } else if (st === 'cancelled') {
      const isAutoLackPay = (m.observation && m.observation.includes('Falta de pagamento')) || (m.attendance && m.attendance.includes('falta de pagamento'));
      statusBadgeClass = 'bg-rose-50 text-rose-700 border border-rose-200';
      statusIcon = 'fa-ban';
      statusLabel = isAutoLackPay ? 'Cancelado (Falta de Pagamento)' : 'Cancelado';
      statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-rose-600';
      statusInlineText = isAutoLackPay ? 'Partida Cancelada automaticamente • Falta de Pagamento' : 'Partida Cancelada';
      statusInlineTextColor = 'text-rose-700';`;

if (content.includes(cardStatusFinishedOld)) {
  content = content.replace(cardStatusFinishedOld, cardStatusFinishedNew);
  console.log('✓ Badges de Cobrar no Final do Mês e Falta de Pagamento adicionados ao card!');
} else {
  console.warn('⚠️ cardStatusFinishedOld não encontrado textualmente, verificando...');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('✔ public/admin.html atualizado com sucesso!');
