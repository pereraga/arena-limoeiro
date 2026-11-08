const fs = require('fs');

const adminPath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(adminPath, 'utf8');

console.log('[1/4] Removendo fallback hardcoded antigo do dia 03/11/2026...');

const oldFallback = `    // Fallback garantido para terça-feira 03/11/2026 com os 5 jogos oficiais completos
    if (matches.length === 0 && (dateStr === '2026-11-03' || dateStr.endsWith('-11-03'))) {
      matches = [
        {
          id: 'ARENA-2913',
          court_id: 'court-society-1',
          court_name: 'SOCIETY - ARENA CENTRAL',
          date: '2026-11-03',
          customer_name: 'Esc Ariadnes',
          customer_phone: '(81) 99556-2693',
          customer_cpf: '000.000.000-00',
          start_time: '16:00',
          end_time: '18:00',
          time: '16:00 às 18:00',
          total_price: 500,
          status: 'confirmed',
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'Mensalidade Faturada',
          observation: 'Horário Fixo Semanal (TERÇA)'
        },
        {
          id: 'ARENA-3294',
          court_id: 'court-futsal-1788963178368',
          court_name: 'FUT 5 - SOCCER 5',
          date: '2026-11-03',
          customer_name: 'Ariadnes',
          customer_phone: '(81) 99999-2609',
          customer_cpf: '000.000.000-00',
          start_time: '16:00',
          end_time: '18:00',
          time: '16:00 às 18:00',
          total_price: 400,
          status: 'confirmed',
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'Mensalidade Faturada',
          observation: 'Horário Fixo Semanal (TERÇA)'
        },
        {
          id: 'ARENA-3251',
          court_id: 'court-futsal-1788963178368',
          court_name: 'QUADRA SOCIETY',
          date: '2026-11-03',
          customer_name: 'Aline',
          customer_phone: '(81) 99246-3081',
          customer_cpf: '',
          start_time: '18:30',
          end_time: '20:00',
          time: '18:30 às 20:00',
          total_price: 400,
          status: 'confirmed',
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'Mensal',
          observation: 'Horário Fixo Semanal (TERÇA)'
        },
        {
          id: 'ARENA-GENILSON-1103',
          court_id: 'court-society-2',
          court_name: 'FUT 6 - SOCCER 6',
          date: '2026-11-03',
          customer_name: 'Genilson',
          customer_phone: '(81) 99966-4317',
          customer_cpf: '',
          start_time: '20:00',
          end_time: '21:30',
          time: '20:00 às 21:30',
          total_price: 600,
          status: 'confirmed',
          isMensalista: true,
          booking_type: 'mensalista',
          payment_method: 'Mensal',
          observation: 'Horário Fixo Semanal (TERÇA)'
        },
        {
          id: 'ARENA-ZELUIZ-1103',
          court_id: 'court-beach-1',
          court_name: 'FUT 7 - SOCCER 7',
          date: '2026-11-03',
          customer_name: 'Zé Luiz',
          customer_phone: '(81) 98877-6655',
          customer_cpf: '',
          start_time: '21:00',
          end_time: '22:30',
          time: '21:00 às 22:30',
          total_price: 500,
          status: 'confirmed',
          booking_type: 'avulso',
          payment_method: 'PIX Balcão',
          observation: 'Reserva Avulsa Noturna'
        }
      ];
    }`;

const newFallback = `    // Não recria jogos de datas antigas (expurgados para economia de espaço)`;

if (content.includes(oldFallback)) {
  content = content.replace(oldFallback, newFallback);
  console.log('✓ Fallback antigo removido com sucesso!');
} else {
  console.error('❌ oldFallback não encontrado!');
  process.exit(1);
}

console.log('[2/4] Criando rotina automática purgeExpiredCloudBookings...');

const purgeFunction = `
  // =========================================================================
  // ROTINA DE EXPURGO AUTOMÁTICO DE JOGOS ANTIGOS (4 DIAS ANTES DO DIA ATUAL)
  // Regra: Mantém o banco de dados sempre leve e com espaço livre para novos jogos.
  // Exemplo: No dia 08, jogos do dia 04 para trás (<= 4 dias) são excluídos 100%
  // de ambos os bancos Supabase (DB1 e DB2) e do estado local.
  // =========================================================================
  window.__lastPurgeExecutionDate = null;

  window.purgeExpiredCloudBookings = async function() {
    try {
      const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-08';
      
      // Executa apenas uma vez por dia (ou quando detectada virada de dia)
      if (window.__lastPurgeExecutionDate === todayStr) {
        return;
      }

      // Calcula data de corte: 4 dias atrás a partir da data atual
      const [ty, tm, td] = todayStr.split('-').map(Number);
      const currDate = new Date(ty, tm - 1, td, 12, 0, 0);
      currDate.setDate(currDate.getDate() - 4);
      
      const cy = currDate.getFullYear();
      const cm = String(currDate.getMonth() + 1).padStart(2, '0');
      const cd = String(currDate.getDate()).padStart(2, '0');
      const cutoffDate = cy + '-' + cm + '-' + cd;

      console.log('[ArenaPurge] Limpando jogos anteriores a ' + cutoffDate + ' (4 dias antes de ' + todayStr + ') para liberar espaço nos bancos...');

      // 1. Exclui do Banco 2 (Supabase Ativo)
      try {
        fetch(ARENA_CLOUD_DBS.db2Url + '/rest/v1/bookings?date=lte.' + encodeURIComponent(cutoffDate), {
          method: 'DELETE',
          headers: {
            apikey: ARENA_CLOUD_DBS.db2Key,
            Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db2Key
          }
        }).catch(err => console.warn('[ArenaPurge] Aviso DELETE DB2:', err));
      } catch(e2) {}

      // 2. Exclui do Banco 1 (Supabase Principal)
      try {
        fetch(ARENA_CLOUD_DBS.db1Url + '/rest/v1/bookings?date=lte.' + encodeURIComponent(cutoffDate), {
          method: 'DELETE',
          headers: {
            apikey: ARENA_CLOUD_DBS.db1Key,
            Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db1Key
          }
        }).catch(err => console.warn('[ArenaPurge] Aviso DELETE DB1:', err));
      } catch(e1) {}

      // 3. Remove do estado local em memória e do localStorage
      if (window.adminGameState && Array.isArray(window.adminGameState.bookings)) {
        const initialCount = window.adminGameState.bookings.length;
        window.adminGameState.bookings = window.adminGameState.bookings.filter(b => !b || !b.date || b.date > cutoffDate);
        if (window.adminGameState.bookings.length !== initialCount) {
          try {
            localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
            localStorage.setItem('arena-limoeiro-games-prototype-v2', JSON.stringify(window.adminGameState.bookings));
          } catch(el) {}
        }
      }

      window.__lastPurgeExecutionDate = todayStr;
      console.log('[ArenaPurge] Expurgo concluído com sucesso! Espaço liberado nos 2 bancos.');
    } catch(err) {
      console.warn('[ArenaPurge] Erro na rotina de expurgo:', err);
    }
  };
`;

const syncBookingTarget = `// Toda e qualquer atualização no sistema é enviada em Dual-Write para ambos os bancos
  window.syncBookingToCloud = async function(booking, action = 'upsert') {`;

if (content.includes(syncBookingTarget)) {
  content = content.replace(syncBookingTarget, purgeFunction + '\n  ' + syncBookingTarget);
  console.log('✓ purgeExpiredCloudBookings inserido com sucesso!');
} else {
  console.error('❌ syncBookingTarget não encontrado!');
  process.exit(1);
}

console.log('[3/4] Integrando purgeExpiredCloudBookings no ciclo de vida e no loop de segundo plano...');

// 3.1 Chamar no __arenaFeedAutoInterval
const autoIntervalSnippet = `// 2. Auto-início e auto-encerramento/cancelamento de partidas
      if (typeof window.checkAndAutoStartMatches === 'function') {
        window.checkAndAutoStartMatches();
      }
      if (typeof window.checkAndAutoExpireMatches === 'function') {
        window.checkAndAutoExpireMatches();
      }`;

const newAutoIntervalSnippet = `// 2. Auto-início, auto-encerramento e expurgo contínuo para manter bancos leves
      if (typeof window.purgeExpiredCloudBookings === 'function') {
        window.purgeExpiredCloudBookings();
      }
      if (typeof window.checkAndAutoStartMatches === 'function') {
        window.checkAndAutoStartMatches();
      }
      if (typeof window.checkAndAutoExpireMatches === 'function') {
        window.checkAndAutoExpireMatches();
      }`;

if (content.includes(autoIntervalSnippet)) {
  content = content.replace(autoIntervalSnippet, newAutoIntervalSnippet);
  console.log('✓ purgeExpiredCloudBookings integrado no __arenaFeedAutoInterval!');
} else {
  console.error('❌ autoIntervalSnippet não encontrado!');
  process.exit(1);
}

console.log('[4/4] Adicionando chamada imediata ao carregar a página...');

const initPullSnippet = `// 3. Sincronização inicial profunda com os Bancos de Dados na Nuvem (Dual-Cloud)
    if (typeof window.pullDataFromCloudDatabases === 'function') {
      window.pullDataFromCloudDatabases();
    }`;

const newInitPullSnippet = `// 3. Expurgo inicial de segurança e sincronização profunda com os bancos de dados
    if (typeof window.purgeExpiredCloudBookings === 'function') {
      window.purgeExpiredCloudBookings();
    }
    if (typeof window.pullDataFromCloudDatabases === 'function') {
      window.pullDataFromCloudDatabases();
    }`;

if (content.includes(initPullSnippet)) {
  content = content.replace(initPullSnippet, newInitPullSnippet);
  console.log('✓ purgeExpiredCloudBookings integrado no início da aplicação!');
} else {
  console.error('❌ initPullSnippet não encontrado!');
  process.exit(1);
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('✔ public/admin.html atualizado com sucesso!');
