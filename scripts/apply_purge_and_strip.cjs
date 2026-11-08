const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../public/admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

console.log('[Script] Iniciando aplicação de expurgo e ajuste de calendário...');

// 1. REMOVER BLOCO HARDCODED DE 03/11 (ARENA-2913)
const startSnippet = "if (matches.length === 0 && (dateStr === '2026-11-03' || dateStr.endsWith('-11-03'))) {";
const endSnippet = "observation: 'Reserva Avulsa Noturna'\n        }\n      ];\n    }";

const startIdx = content.indexOf(startSnippet);
const endIdx = content.indexOf(endSnippet);

if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
  const fullBlock = content.slice(startIdx, endIdx + endSnippet.length);
  content = content.replace(fullBlock, "// Bloco de fallback de 03/11/2026 removido para respeitar o expurgo definitivo de dados antigos");
  console.log('✓ Bloco hardcoded ARENA-2913 removido com sucesso!');
} else {
  console.warn('! Bloco ARENA-2913 já removido ou não encontrado.');
}

// 2. ADICIONAR FUNÇÃO window.purgeExpiredCloudBookings ANTES DE syncBookingToCloud
const targetDual = "// Toda e qualquer atualização no sistema é enviada em Dual-Write para ambos os bancos";
if (content.includes(targetDual)) {
  const purgeFunctionCode = `// ============================================================================
  // 🗑️ EXPURGO AUTOMÁTICO DE DADOS ANTIGOS (LIBERAÇÃO 100% DE ESPAÇO NO SUPABASE)
  // Exclui do DB1 e DB2 todas as partidas com data anterior a 4 dias do dia atual
  // Ex: se hoje é dia 08, datas <= dia 04 são totalmente deletadas do banco e do cliente
  // ============================================================================
  window.purgeExpiredCloudBookings = async function() {
    try {
      const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08';
      const [ty, tm, td] = todayStr.split('-').map(Number);
      const cutoffDateObj = new Date(ty, tm - 1, td - 4, 12, 0, 0);
      const cY = cutoffDateObj.getFullYear();
      const cM = String(cutoffDateObj.getMonth() + 1).padStart(2, '0');
      const cD = String(cutoffDateObj.getDate()).padStart(2, '0');
      const cutoffDate = \`\${cY}-\${cM}-\${cD}\`;

      console.log(\`[ArenaPurge] Executando expurgo de dados antigos: Hoje=\${todayStr}, Limite de Corte (<= 4 dias)=\${cutoffDate}\`);

      // 1. Exclui do Banco 2 (Ativo / Salvaguarda) via Supabase REST DELETE em lote
      try {
        const delRes2 = await fetch(ARENA_CLOUD_DBS.db2Url + '/rest/v1/bookings?date=lte.' + cutoffDate, {
          method: 'DELETE',
          headers: {
            apikey: ARENA_CLOUD_DBS.db2Key,
            Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db2Key
          }
        });
        if (delRes2.ok) {
          console.log(\`[ArenaPurge] Sucesso no DB2: Jogos <= \${cutoffDate} deletados permanentemente.\`);
        }
      } catch(e2) {
        console.warn('[ArenaPurge] Erro ao deletar no DB2:', e2);
      }

      // 2. Exclui do Banco 1 (Principal) via Supabase REST DELETE em lote
      try {
        const delRes1 = await fetch(ARENA_CLOUD_DBS.db1Url + '/rest/v1/bookings?date=lte.' + cutoffDate, {
          method: 'DELETE',
          headers: {
            apikey: ARENA_CLOUD_DBS.db1Key,
            Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db1Key
          }
        });
        if (delRes1.ok) {
          console.log(\`[ArenaPurge] Sucesso no DB1: Jogos <= \${cutoffDate} deletados permanentemente.\`);
        }
      } catch(e1) {
        console.warn('[ArenaPurge] Erro ao deletar no DB1:', e1);
      }

      // 3. Higieniza estado operacional na memória do cliente
      if (window.adminGameState && Array.isArray(window.adminGameState.bookings)) {
        const initialCount = window.adminGameState.bookings.length;
        window.adminGameState.bookings = window.adminGameState.bookings.filter(b => {
          if (!b || !b.date) return false;
          return b.date > cutoffDate;
        });
        const removed = initialCount - window.adminGameState.bookings.length;
        if (removed > 0) {
          console.log(\`[ArenaPurge] \${removed} reservas antigas removidas da memória local.\`);
        }
      }

      // 4. Salva o localStorage limpo (evita ressuscitação ao recarregar a página)
      try {
        if (window.adminGameState && window.adminGameState.bookings) {
          localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
          localStorage.setItem('arena-limoeiro-games-prototype-v2', JSON.stringify(window.adminGameState.bookings));
        }
      } catch(eLocal) {}

      // 5. Marca timestamp/data da última execução do expurgo
      window.__lastPurgeExecutionDate = todayStr;

      // 6. Atualiza as telas e contadores visuais
      if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
      if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
      if (typeof window.updateMovementCalendarStrip === 'function') window.updateMovementCalendarStrip();
    } catch(err) {
      console.error('[ArenaPurge] Erro no expurgo:', err);
    }
  };

  ` + targetDual;

  content = content.replace(targetDual, purgeFunctionCode);
  console.log('✓ Função purgeExpiredCloudBookings inserida com sucesso!');
} else {
  console.error('! targetDual não encontrado.');
}

// 3. PURGE NO INÍCIO DE pullDataFromCloudDatabases
const targetPull = "pullDataFromCloudDatabases = async function() {";
if (content.includes(targetPull)) {
  const pullReplacement = `pullDataFromCloudDatabases = async function() {
    // Executa expurgo diário preventivo antes de puxar dados (libera espaço e evita baixar registros mortos)
    try {
      const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '';
      if (todayStr && window.__lastPurgeExecutionDate !== todayStr && typeof window.purgeExpiredCloudBookings === 'function') {
        await window.purgeExpiredCloudBookings();
      }
    } catch(pErr) {}`;
  content = content.replace(targetPull, pullReplacement);
  console.log('✓ Chamada de expurgo inserida em pullDataFromCloudDatabases!');
} else {
  console.error('! targetPull não encontrado.');
}

// 4. PURGE NO LOOP DE 7s (__arenaFeedAutoInterval)
const targetInterval = "if (!window.__arenaFeedAutoInterval) {";
if (content.includes(targetInterval)) {
  const intervalReplacement = `if (!window.__arenaFeedAutoInterval) {
    // Checagem de expurgo contínuo a cada virada de dia ou ciclo
    try {
      const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '';
      if (todayStr && window.__lastPurgeExecutionDate !== todayStr && typeof window.purgeExpiredCloudBookings === 'function') {
        window.purgeExpiredCloudBookings();
      }
    } catch(eP) {}`;
  content = content.replace(targetInterval, intervalReplacement + "\n    " + targetInterval);
  console.log('✓ Checagem de expurgo adicionada em __arenaFeedAutoInterval!');
} else {
  console.error('! targetInterval não encontrado.');
}

// 5. PURGE NA INICIALIZAÇÃO initAdminGames
const targetInitGames = `// Sincroniza em segundo plano com os 2 Bancos de Dados na Nuvem (Dual-Cloud)
    if (typeof window.pullDataFromCloudDatabases === 'function') {
      window.pullDataFromCloudDatabases();
    }`;

if (content.includes(targetInitGames)) {
  const initReplacement = `// Expurgo automático de agendamentos com mais de 4 dias para liberar espaço permanente no Supabase
    if (typeof window.purgeExpiredCloudBookings === 'function') {
      window.purgeExpiredCloudBookings();
    }

    // Sincroniza em segundo plano com os 2 Bancos de Dados na Nuvem (Dual-Cloud)
    if (typeof window.pullDataFromCloudDatabases === 'function') {
      window.pullDataFromCloudDatabases();
    }`;
  content = content.replace(targetInitGames, initReplacement);
  console.log('✓ purgeExpiredCloudBookings conectado na inicialização de initAdminGames!');
} else {
  console.error('! targetInitGames não encontrado.');
}

// 6. AJUSTAR O CARROSSEL HORIZONTAL DE DATAS (renderMovementCalendarStrip)
// Limita as datas passadas para no máximo 3 dias atrás (offset = -3 a +17) e garante que datas anteriores ao corte não existam
const targetLoop = "for (let offset = -3; offset <= 17; offset++) {";
if (content.includes(targetLoop)) {
  console.log('✓ Loop de offset do calendário já configurado de -3 até +17 (limite de dias passados ativo).');
} else {
  console.warn('! Loop de offset do calendário com formato diferente.');
}

// Salva o arquivo admin.html modificado
fs.writeFileSync(adminPath, content, 'utf8');
console.log('✓ Arquivo public/admin.html atualizado com sucesso!');
