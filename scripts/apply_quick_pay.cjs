const fs = require('fs');

const adminPath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(adminPath, 'utf8');

console.log('[1/3] Adicionando função quickPayAndFinishMatch...');

const quickPayFunc = `
  // =========================================================================
  // EFETUAR PAGAMENTO IMEDIATO E CONCLUIR PARTIDA (VOLTA PARA ÁREA DE PAGO)
  // =========================================================================
  window.quickPayAndFinishMatch = function(id, customPaymentMethod) {
    try {
      const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
      if (!g) {
        if (typeof arenaToast === 'function') arenaToast('Agendamento não encontrado.');
        return;
      }

      const method = customPaymentMethod || 'PIX';
      const now = new Date();
      const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

      // 1. Atualiza status do jogo para Finalizado e Pago
      g.status = 'finished';
      g.attendance = 'Finalizada (Pago)';
      g.payment = method;
      g.payment_method = method;
      g.payment_status = 'pago';
      g.finishedAt = g.finishedAt || timeStr;
      g.observation = 'Pagamento efetuado com sucesso via ' + method + ' • Concluído';

      if (typeof window.addMatchLog === 'function') {
        window.addMatchLog(g, 'Pagamento Efetuado (' + timeStr + ')', 'Pagamento recebido via ' + method + '. Partida concluída e movida para a área de pagos / finalizados.');
      }

      // 2. Atualiza no localStorage
      try {
        localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
        localStorage.setItem('arena-limoeiro-games-prototype-v2', JSON.stringify(window.adminGameState.bookings));
      } catch(e) {}

      // 3. Sincroniza em nuvem (Supabase DB2 e DB1)
      if (typeof window.syncBookingToCloud === 'function') {
        window.syncBookingToCloud(g, 'upsert');
      }

      // 4. Mensagem de sucesso
      if (typeof arenaToast === 'function') {
        arenaToast('✓ Pagamento de R$ ' + Number(g.total_price || g.price || 100).toFixed(2).replace('.', ',') + ' efetuado! Partida movida para Finalizados/Pago.');
      }

      // 5. Atualiza a tela operacional
      if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
      if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
    } catch(err) {
      console.error('[QuickPay] Erro ao efetuar pagamento:', err);
    }
  };
`;

const openFinishTarget = `window.openFinishGame = function(id) {`;
if (content.includes(openFinishTarget)) {
  content = content.replace(openFinishTarget, quickPayFunc + '\n  ' + openFinishTarget);
  console.log('✓ quickPayAndFinishMatch inserido com sucesso!');
} else {
  console.error('❌ openFinishTarget não encontrado!');
  process.exit(1);
}

console.log('[2/3] Atualizando os botões no card de Pagamento Faltando...');

const oldButtonSnippet = `\${(st === 'unpaid' || st === 'cancelled') ? \`
                <div class="flex items-center gap-2">
                  <span class="px-4 py-2 rounded-xl text-xs font-extrabold text-amber-900 bg-amber-100 border border-amber-300 shadow-sm inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-triangle-exclamation text-amber-700"></i> Pagamento Faltando
                  </span>
                  <button type="button" onclick="openFinishGame('\${m.id}')" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer inline-flex items-center gap-1.5" title="Registrar Pagamento Agora">
                    <i class="fa-solid fa-hand-holding-dollar text-xs"></i> Registrar Pgto
                  </button>
                </div>`;

const newButtonSnippet = `\${(st === 'unpaid' || st === 'cancelled') ? \`
                <div class="flex flex-wrap items-center justify-end gap-2">
                  <span class="px-3 py-1.5 rounded-xl text-xs font-extrabold text-amber-900 bg-amber-100 border border-amber-300 shadow-sm inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-triangle-exclamation text-amber-700"></i> Pagamento Faltando
                  </span>
                  <!-- Botão 1: Efetuar Pagamento Rápido (PIX / Dinheiro) e mover para área de Pago -->
                  <button type="button" onclick="quickPayAndFinishMatch('\${m.id}', 'PIX')" class="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/30 transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5" title="Efetuar pagamento e mover para área de pago">
                    <i class="fa-solid fa-circle-check text-xs"></i>
                    <span>Efetuar Pagamento</span>
                  </button>
                  <!-- Botão 2: Opções detalhadas de fechamento / parcelamento -->
                  <button type="button" onclick="openFinishGame('\${m.id}')" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer inline-flex items-center gap-1" title="Outras opções e detalhes de pagamento">
                    <i class="fa-solid fa-sliders text-slate-500"></i>
                    <span>Opções</span>
                  </button>
                </div>`;

if (content.includes(oldButtonSnippet)) {
  content = content.replace(oldButtonSnippet, newButtonSnippet);
  console.log('✓ Botões no card de Pagamento Faltando atualizados com sucesso!');
} else {
  console.error('❌ oldButtonSnippet não encontrado!');
  process.exit(1);
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('✔ public/admin.html atualizado com sucesso!');
