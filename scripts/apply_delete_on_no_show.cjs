const fs = require('fs');

const adminPath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(adminPath, 'utf8');

console.log('[1/4] Atualizando o modal de Não Comparecimento (arenaNoShowModal)...');

const oldModalContent = `<div class="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 font-medium">
        Você está prestes a marcar esta partida como <strong class="font-black text-red-950">Não compareceu</strong>. O histórico da partida registrará a ocorrência de falta.
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Motivo / Justificativa da Falta</label>
        <textarea id="noShowReason" rows="3" required placeholder="Ex.: Equipe não apareceu e não atendeu as tentativas de contato via WhatsApp."
                  class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"></textarea>
      </div>

      <div class="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
        <button type="button" onclick="closeArenaModal('arenaNoShowModal')" class="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer">
          Voltar
        </button>
        <button type="submit" class="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer">
          <i data-lucide="alert-circle" class="w-4 h-4"></i>
          <span>Confirmar Falta</span>
        </button>
      </div>`;

const newModalContent = `<div class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 font-medium">
        Ao confirmar que o responsável da partida <strong class="font-black text-rose-950">não veio / faltou</strong>, este jogo será <strong>removido permanentemente do banco de dados</strong> e a quadra/horário será imediatamente liberada.
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Motivo / Justificativa da Ausência *</label>
        <textarea id="noShowReason" rows="3" required placeholder="Ex.: O responsável não compareceu no horário e não atendeu as tentativas de contato."
                  class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"></textarea>
      </div>

      <div class="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
        <button type="button" onclick="closeArenaModal('arenaNoShowModal')" class="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer">
          Voltar
        </button>
        <button type="submit" class="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
          <span>Confirmar e Remover do Banco</span>
        </button>
      </div>`;

if (content.includes(oldModalContent)) {
  content = content.replace(oldModalContent, newModalContent);
  console.log('✓ Textos e botões de arenaNoShowModal atualizados!');
} else {
  console.error('❌ oldModalContent não encontrado!');
  process.exit(1);
}

console.log('[2/4] Atualizando a primeira ocorrência de applyNoShow...');

const oldApply1 = `window.applyNoShow = function() {
    const id = document.getElementById('noShowMatchId').value;
    const g = getGame(id);
    if (!g) return;
    g.status = 'no-show';
    g.attendance = 'Não compareceu';
    const reason = document.getElementById('noShowReasonInput').value.trim();
    addMatchLog(g, 'Não compareceu', reason || 'Ausência registrada pela administração.');
    saveAdminGameState();
    closeArenaModal('arenaNoShowModal');
    arenaToast('Ausência registrada no histórico.');
  };`;

const newApply1 = `window.applyNoShow = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('noShowMatchId').value;
    const reason = (document.getElementById('noShowReason')?.value || document.getElementById('noShowReasonInput')?.value || '').trim() || 'Responsável não compareceu';
    
    // Remove completamente do estado local
    const bookingToDelete = (window.adminGameState.bookings || []).find(b => String(b.id) === String(id)) || { id: id, observation: reason };
    window.adminGameState.bookings = (window.adminGameState.bookings || []).filter(b => String(b.id) !== String(id));
    
    // Atualiza o localStorage local
    try {
      localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
      localStorage.setItem('arena-limoeiro-games-prototype-v2', JSON.stringify(window.adminGameState.bookings));
    } catch(err) {}

    // ☁️ Exclui do Supabase (DB1 e DB2) com garantia de imunidade contra ressuscitação
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(bookingToDelete, 'delete');
    }

    closeArenaModal('arenaNoShowModal');
    if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
    if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
    if (typeof arenaToast === 'function') {
      arenaToast('✓ Ausência confirmada. O jogo foi excluído e sumiu do banco de dados!');
    }
  };`;

if (content.includes(oldApply1)) {
  content = content.replace(oldApply1, newApply1);
  console.log('✓ Primeira ocorrência de applyNoShow atualizada para remoção total!');
} else {
  console.error('❌ oldApply1 não encontrado!');
  process.exit(1);
}

console.log('[3/4] Atualizando a segunda ocorrência de applyNoShow...');

const oldApply2 = `// Confirmar Falta / Não Compareceu
  window.applyNoShow = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('noShowMatchId').value;
    const g = getGame(id);
    if (!g) return;

    const reason = document.getElementById('noShowReason').value.trim() || 'Equipe não compareceu';
    g.attendance = 'Não compareceu';
    g.status = 'cancelled';
    addMatchLog(g, 'Falta registrada', reason);

    saveAdminGameState();
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
    }
    closeArenaModal('arenaNoShowModal');
    renderMovementMatches();
    renderCadastrosBookingsList();
    arenaToast('Falta registrada no histórico da partida.');
  };`;

const newApply2 = `// Confirmar Falta / Não Compareceu: Faz o jogo sumir completamente do banco de dados
  window.applyNoShow = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('noShowMatchId').value;
    const reason = (document.getElementById('noShowReason')?.value || document.getElementById('noShowReasonInput')?.value || '').trim() || 'Responsável não compareceu';

    // Remove do estado local
    const bookingToDelete = (window.adminGameState.bookings || []).find(b => String(b.id) === String(id)) || { id: id, observation: reason };
    window.adminGameState.bookings = (window.adminGameState.bookings || []).filter(b => String(b.id) !== String(id));

    // Persiste no localStorage
    try {
      localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
      localStorage.setItem('arena-limoeiro-games-prototype-v2', JSON.stringify(window.adminGameState.bookings));
    } catch(err) {}

    // ☁️ Exclui imediatamente do Supabase DB1 e DB2 na nuvem (DELETE oficial)
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(bookingToDelete, 'delete');
    }

    closeArenaModal('arenaNoShowModal');
    if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
    if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
    if (typeof arenaToast === 'function') {
      arenaToast('✓ Ausência confirmada. O jogo foi excluído e sumiu do banco de dados!');
    }
  };`;

if (content.includes(oldApply2)) {
  content = content.replace(oldApply2, newApply2);
  console.log('✓ Segunda ocorrência de applyNoShow atualizada para remoção total!');
} else {
  console.error('❌ oldApply2 não encontrado!');
  process.exit(1);
}

console.log('[4/4] Adicionando botão rápido "Não Compareceu" ao lado de Efetuar Pagamento no card de Pagamento Faltando...');

const oldCardPayArea = `<!-- Botão de Pagamento: Abre a janela padrão para escolher a forma (PIX, Dinheiro, Cartão, Dividido) e concluir -->
                  <button type="button" id="btn-pay-action-\${m.id}" onclick="openFinishGame('\${m.id}')" class="px-5 py-2.5 rounded-full font-black text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer" title="Abrir janela para escolher a forma de pagamento e concluir partida">
                    <i class="fa-solid fa-hand-holding-dollar text-sm"></i>
                    <span>Efetuar Pagamento</span>
                  </button>`;

const newCardPayArea = `<!-- Botão de Não Compareceu / Falta: Abre modal de justificativa e apaga o jogo do banco -->
                  <button type="button" onclick="openNoShow('\${m.id}')" class="px-3.5 py-2 rounded-full font-bold text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer" title="Responsável não compareceu (remover do sistema)">
                    <i class="fa-solid fa-user-xmark text-xs text-rose-600"></i>
                    <span>Não Compareceu</span>
                  </button>
                  <!-- Botão de Pagamento: Abre a janela padrão para escolher a forma (PIX, Dinheiro, Cartão, Dividido) e concluir -->
                  <button type="button" id="btn-pay-action-\${m.id}" onclick="openFinishGame('\${m.id}')" class="px-5 py-2.5 rounded-full font-black text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer" title="Abrir janela para escolher a forma de pagamento e concluir partida">
                    <i class="fa-solid fa-hand-holding-dollar text-sm"></i>
                    <span>Efetuar Pagamento</span>
                  </button>`;

if (content.includes(oldCardPayArea)) {
  content = content.replace(oldCardPayArea, newCardPayArea);
  console.log('✓ Botão "Não Compareceu" adicionado diretamente no card de Pagamento Faltando!');
} else {
  console.error('❌ oldCardPayArea não encontrado!');
  process.exit(1);
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('✔ public/admin.html atualizado com sucesso!');
