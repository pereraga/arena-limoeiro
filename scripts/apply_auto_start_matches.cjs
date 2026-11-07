const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../public/admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

console.log('Original length:', content.length);

// 1. Inserir a função window.checkAndAutoStartMatches logo antes de window.checkIsMatchLive
const oldCheckIsMatchLive = `  // Funções dedicadas para cada status de partida
  window.checkIsMatchLive = function(m, todayStr) {`;

const newAutoStartAndCheck = `  // =========================================================================
  // AUTO-INÍCIO AUTOMÁTICO DE PARTIDAS (COM JANELA DE TOLERÂNCIA DE 5 MINUTOS)
  // Se o atendente não apertar "Iniciar Jogo na Quadra", o sistema inicia
  // automaticamente aos 5 minutos decorridos, contando do início exato previsto.
  // =========================================================================
  window.checkAndAutoStartMatches = function() {
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

      let hasAutoStartedAny = false;

      allTodayMatches.forEach(m => {
        if (!m || m.status === 'finished' || m.status === 'cancelled') return;
        const sM = parseMin(m.start_time);
        let eM = parseMin(m.end_time);
        if (eM <= sM) eM += 24 * 60;

        // Se já passou de 5 minutos do início programado (curM >= sM + 5) e ainda não terminou
        if (curM >= (sM + 5) && curM <= eM) {
          const isAlreadyLive = (m.status === 'live' || m.status === 'playing' || m.status === 'in_progress');
          if (!isAlreadyLive) {
            // Inicia automaticamente o jogo
            const g = (typeof window.getGame === 'function') ? window.getGame(m.id) : m;
            if (g) {
              g.status = 'live';
              g.attendance = 'Em Quadra';
              g.startedAt = m.start_time; // Contando exatamente do início oficial previsto
              if (!Array.isArray(g.log)) g.log = [];
              g.log.push({
                at: 'Início Automático (' + m.start_time + ')',
                text: 'Partida iniciada automaticamente pelo sistema após 5 min de tolerância, contando do início programado.'
              });

              if (typeof window.syncBookingToCloud === 'function') {
                window.syncBookingToCloud(g, 'upsert');
              }
              hasAutoStartedAny = true;
              console.log('[AutoStart] Partida ' + (g.customer_name || g.name) + ' iniciada automaticamente!');
            }
          }
        }
      });

      if (hasAutoStartedAny) {
        try {
          localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
        } catch(e) {}
        if (typeof window.saveAdminGameState === 'function') window.saveAdminGameState();
        if (typeof window.renderMovementMatches === 'function') window.renderMovementMatches();
        if (typeof window.renderCadastrosBookingsList === 'function') window.renderCadastrosBookingsList();
      }
    } catch(err) {
      console.warn('[AutoStart] Erro ao verificar auto-início:', err);
    }
  };

  // Funções dedicadas para cada status de partida
  window.checkIsMatchLive = function(m, todayStr) {`;

if (!content.includes(oldCheckIsMatchLive)) {
  console.error('ERROR: oldCheckIsMatchLive not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldCheckIsMatchLive, newAutoStartAndCheck);
console.log('✓ checkAndAutoStartMatches inserido com sucesso.');

// 2. Chamar checkAndAutoStartMatches no intervalo contínuo (window.__arenaFeedAutoInterval)
const oldInterval = `      // 2. Sincronização contínua com os bancos de dados na nuvem (já renderiza partidas ao concluir)
      if (typeof window.pullDataFromCloudDatabases === 'function') {
        window.pullDataFromCloudDatabases();
      }`;

const newInterval = `      // 2. Auto-início automático de partidas com tolerância de 5 min
      if (typeof window.checkAndAutoStartMatches === 'function') {
        window.checkAndAutoStartMatches();
      }

      // 3. Sincronização contínua com os bancos de dados na nuvem (já renderiza partidas ao concluir)
      if (typeof window.pullDataFromCloudDatabases === 'function') {
        window.pullDataFromCloudDatabases();
      }`;

if (!content.includes(oldInterval)) {
  console.error('ERROR: oldInterval not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldInterval, newInterval);
console.log('✓ checkAndAutoStartMatches acoplado ao intervalo contínuo.');

// 3. Executar checkAndAutoStartMatches no início de renderMovementMatches para responsividade imediata
const oldRenderMatchesStart = `    // Recupera TODAS as partidas do dia para estatísticas completas
    const allMatches = getMatchesForDate(dateStr);`;

const newRenderMatchesStart = `    // Auto-início de partidas que atingiram a tolerância de 5 min
    if (typeof window.checkAndAutoStartMatches === 'function') {
      window.checkAndAutoStartMatches();
    }

    // Recupera TODAS as partidas do dia para estatísticas completas
    const allMatches = getMatchesForDate(dateStr);`;

if (!content.includes(oldRenderMatchesStart)) {
  console.error('ERROR: oldRenderMatchesStart not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldRenderMatchesStart, newRenderMatchesStart);
console.log('✓ checkAndAutoStartMatches acoplado à renderMovementMatches.');

// 4. No renderMatchCardHtml: Se curM >= (sM + 5) no dia de hoje, a partida é considerada 'live' (Em Andamento)
// e o botão exibe "Finalizar" (vermelho) automaticamente
const oldCardIsLive = `    const st = m.status || 'confirmed';
    const isLive = (st === 'live' || st === 'playing' || st === 'in_progress');`;

const newCardIsLive = `    const st = m.status || 'confirmed';
    const nowTimeMin = (function() {
      const now = new Date();
      return now.getHours() * 60 + now.getMinutes();
    })();
    const parseSlotMin = (s) => {
      if (!s) return 0;
      const p = s.split(':');
      return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
    };
    const sMinStart = parseSlotMin(startT);
    let sMinEnd = parseSlotMin(endT);
    if (sMinEnd <= sMinStart) sMinEnd += 24 * 60;

    // Regra dos 5 minutos: Se for hoje e já passaram 5 min do horário previsto, entra automaticamente como Em Andamento (isLive = true)
    const isOverdueAutoStart = isToday && (st !== 'finished' && st !== 'cancelled' && st !== 'no-show') && (nowTimeMin >= (sMinStart + 5) && nowTimeMin <= sMinEnd);
    const isLive = (st === 'live' || st === 'playing' || st === 'in_progress' || isOverdueAutoStart);`;

if (!content.includes(oldCardIsLive)) {
  console.error('ERROR: oldCardIsLive not found in admin.html!');
  process.exit(1);
}
content = content.replace(oldCardIsLive, newCardIsLive);
console.log('✓ renderMatchCardHtml atualizado com regra dos 5 minutos para isLive.');

// 5. No botão principal do card, exibir indicação caso esteja nos 5 minutos de tolerância antes do auto-início
const oldStartButton = `              \` : \`
                <button type="button" id="btn-main-action-\${m.id}" onclick="handleGameMainAction('\${m.id}')" title="Iniciar jogo na quadra" class="w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs text-white bg-emerald-700 hover:bg-emerald-600 shadow-md shadow-emerald-700/25 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                  <i class="fa-solid fa-play text-[10px]"></i> Iniciar Jogo na Quadra
                </button>
              \`)}`;

const newStartButton = `              \` : \`
                <button type="button" id="btn-main-action-\${m.id}" onclick="handleGameMainAction('\${m.id}')" title="Iniciar jogo na quadra" class="w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs text-white bg-emerald-700 hover:bg-emerald-600 shadow-md shadow-emerald-700/25 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                  <i class="fa-solid fa-play text-[10px]"></i> \${(isToday && nowTimeMin >= sMinStart && nowTimeMin < (sMinStart + 5)) ? ('Iniciar Jogo (' + ((sMinStart + 5) - nowTimeMin) + 'm p/ auto)') : 'Iniciar Jogo na Quadra'}
                </button>
              \`)}`;

if (content.includes(oldStartButton)) {
  content = content.replace(oldStartButton, newStartButton);
  console.log('✓ Botão Iniciar Jogo atualizado com feedback de auto-início.');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('✓ public/admin.html salvo com sucesso. Novo tamanho:', content.length);
