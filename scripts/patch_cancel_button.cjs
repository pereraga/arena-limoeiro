const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// 1. Corrigir chamada do botão Cancelar partida
const oldBtn = `<button type="button" onclick="cancelGame('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-ban text-rose-500"></i> Cancelar partida
              </button>`;

const newBtn = `<button type="button" onclick="window.cancelGame('\${m.id}', event)" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-ban text-rose-500"></i> Cancelar partida
              </button>`;

if (html.includes(oldBtn)) {
  html = html.replace(oldBtn, newBtn);
  console.log('1. Botão Cancelar partida atualizado com window.cancelGame');
} else {
  console.log('1. Botão Cancelar partida já atualizado ou não encontrado');
}

// 2. Garantir cancelGame tanto no escopo global window quanto no escopo local
const oldCancelDef = `window.cancelGame = async function(id) {`;
const newCancelDef = `window.cancelGame = async function(id, evt) {
    if (evt && evt.stopPropagation) evt.stopPropagation();`;

if (html.includes(oldCancelDef) && !html.includes(newCancelDef)) {
  html = html.replace(oldCancelDef, newCancelDef);
  console.log('2. cancelGame atualizado para aceitar evt');
}

// Adiciona alias local cancelGame se não existir
if (!html.includes('const cancelGame = window.cancelGame;')) {
  html = html.replace(
    'window.cancelGame = async function(id, evt) {',
    'const cancelGame = window.cancelGame = async function(id, evt) {'
  );
  console.log('3. cancelGame disponibilizado como const local e window.cancelGame');
}

// 3. Robustecer exclusão do mensalista e de suas partidas em cancelGame:
// Se for um monthly-* ou um jogo com booking_type === 'mensalista':
// Além de registrar em arena_jogos_excluidos_v1, remover imediatamente de window.adminGameState.monthlyMembers
// e excluir de monthly_members na nuvem caso o usuário deseje cancelar o contrato / jogo
const oldCloudDelete = `// 3. Excluir dos Bancos de Dados Supabase DB1 e DB2`;
const newCloudDelete = `// 2.1 Se for um jogo de mensalista (monthly-*), remover do estado em memória e desativar/excluir o contrato
    if (targetId.startsWith('monthly-')) {
      const rawMId = targetId.replace('monthly-', '');
      window.adminGameState.monthlyMembers = (window.adminGameState.monthlyMembers || []).filter(m => String(m.id) !== rawMId);
      
      const deleteMonthlyCloud = async (dbUrl, dbKey) => {
        try {
          await fetch(dbUrl + '/rest/v1/monthly_members?id=eq.' + encodeURIComponent(rawMId), {
            method: 'DELETE',
            headers: { apikey: dbKey, Authorization: 'Bearer ' + dbKey, Prefer: 'return=minimal' }
          });
        } catch(e) {}
      };
      if (window.ARENA_CLOUD_DBS) {
        Promise.allSettled([
          deleteMonthlyCloud(ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db2Key),
          deleteMonthlyCloud(ARENA_CLOUD_DBS.db1Url, ARENA_CLOUD_DBS.db1Key)
        ]);
      }
    }

    // 3. Excluir dos Bancos de Dados Supabase DB1 e DB2`;

if (html.includes(oldCloudDelete) && !html.includes('deleteMonthlyCloud')) {
  html = html.replace(oldCloudDelete, newCloudDelete);
  console.log('4. Exclusão de monthly_members integrada ao cancelGame');
}

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('admin.html salvo com sucesso.');
