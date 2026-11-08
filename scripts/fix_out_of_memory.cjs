const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('[FixOOM] Starting fix for Out of Memory error...');

// 1. Rewrite checkAndAutoExpireMatches with recursion lock and strict unpaid/cancelled filter
const oldExpireFn = `  window.checkAndAutoExpireMatches = function() {
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
            // AVULSO: Registra como Pagamento Faltando após término do horário
            g.status = 'unpaid';
            g.attendance = 'Pagamento Faltando';
            g.payment_status = 'pagamento_faltando';
            g.observation = 'Horário encerrado • Pagamento Faltando';
            if (!g.payment || g.payment === 'Pendente') g.payment = 'Pagamento Faltando';
            if (typeof window.addMatchLog === 'function') {
              window.addMatchLog(g, 'Fim do Horário (' + (m.end_time || '') + ')', 'Horário de jogo encerrado. Pagamento não registrado (Pagamento Faltando).');
            }
            console.log('[AutoExpire] Jogo avulso ' + (g.customer_name || g.name) + ' registrado com Pagamento Faltando!');
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
      }
    } catch(err) {
      console.warn('[AutoExpire] Erro ao verificar encerramento automático:', err);
    }
  };`;

const newExpireFn = `  window.checkAndAutoExpireMatches = function() {
    // Trava de recursão rigorosa para impedir estouro de memória (Out of Memory)
    if (window.__isAutoExpiring) return;
    window.__isAutoExpiring = true;

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
        // Pula partidas já finalizadas, canceladas ou que já estão marcadas como pagamento faltando
        if (!m) return;
        const st = m.status;
        if (st === 'finished' || st === 'cancelled' || st === 'unpaid' || m.payment_status === 'pagamento_faltando') return;
        if (m.attendance && m.attendance.includes('Pagamento Faltando')) return;
        if (m.observation && m.observation.includes('Pagamento Faltando')) return;

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
            // AVULSO: Registra como Pagamento Faltando após término do horário
            g.status = 'unpaid';
            g.attendance = 'Pagamento Faltando';
            g.payment_status = 'pagamento_faltando';
            g.observation = 'Horário encerrado • Pagamento Faltando';
            if (!g.payment || g.payment === 'Pendente') g.payment = 'Pagamento Faltando';
            if (typeof window.addMatchLog === 'function') {
              window.addMatchLog(g, 'Fim do Horário (' + (m.end_time || '') + ')', 'Horário de jogo encerrado. Pagamento não registrado (Pagamento Faltando).');
            }
            console.log('[AutoExpire] Jogo avulso ' + (g.customer_name || g.name) + ' registrado com Pagamento Faltando!');
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
          localStorage.setItem('arena-limoeiro-games-prototype-v2', JSON.stringify(window.adminGameState.bookings));
        } catch(e) {}
        if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
      }
    } catch(err) {
      console.warn('[AutoExpire] Erro ao verificar encerramento automático:', err);
    } finally {
      window.__isAutoExpiring = false;
    }
  };`;

if (content.includes(oldExpireFn)) {
  content = content.replace(oldExpireFn, newExpireFn);
  console.log('[FixOOM] 1. checkAndAutoExpireMatches protected and loop severed.');
} else {
  console.error('[FixOOM] ERROR: oldExpireFn not found!');
  process.exit(1);
}

// 2. Rewrite checkAndAutoStartMatches with recursion lock and loop severance
const oldStartFn = `  window.checkAndAutoStartMatches = function() {
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
      }
    } catch(err) {
      console.warn('[AutoStart] Erro ao verificar auto-início:', err);
    }
  };`;

const newStartFn = `  window.checkAndAutoStartMatches = function() {
    // Trava de recursão rigorosa para impedir estouro de memória (Out of Memory)
    if (window.__isAutoStarting) return;
    window.__isAutoStarting = true;

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
        if (!m) return;
        const st = m.status;
        if (st === 'finished' || st === 'cancelled' || st === 'unpaid' || m.payment_status === 'pagamento_faltando') return;
        const sM = parseMin(m.start_time);
        let eM = parseMin(m.end_time);
        if (eM <= sM) eM += 24 * 60;

        // Se já passou de 5 minutos do início programado (curM >= sM + 5) e ainda não terminou
        if (curM >= (sM + 5) && curM <= eM) {
          const isAlreadyLive = (st === 'live' || st === 'playing' || st === 'in_progress');
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
          localStorage.setItem('arena-limoeiro-games-prototype-v2', JSON.stringify(window.adminGameState.bookings));
        } catch(e) {}
        if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
      }
    } catch(err) {
      console.warn('[AutoStart] Erro ao verificar auto-início:', err);
    } finally {
      window.__isAutoStarting = false;
    }
  };`;

if (content.includes(oldStartFn)) {
  content = content.replace(oldStartFn, newStartFn);
  console.log('[FixOOM] 2. checkAndAutoStartMatches protected and loop severed.');
} else {
  console.error('[FixOOM] ERROR: oldStartFn not found!');
  process.exit(1);
}

// 3. Add recursion lock to renderMovementMatches and saveAdminGameState
const oldRenderMatches = `  function renderMovementMatches() {
    const dateStr = window.adminGameState.selectedDate || '2026-11-03';`;

const newRenderMatches = `  function renderMovementMatches() {
    // Trava de recursão para evitar re-entrâncias durante a montagem do feed
    if (window.__isRenderingMovementMatches) return;
    window.__isRenderingMovementMatches = true;

    try {
      const dateStr = window.adminGameState.selectedDate || '2026-11-03';`;

const oldRenderMatchesEnd = `    if (typeof window.updateMovementCalendarStrip === 'function') {
      window.updateMovementCalendarStrip();
    }
    if (window.lucide) lucide.createIcons();
  };`;

const newRenderMatchesEnd = `    if (typeof window.updateMovementCalendarStrip === 'function') {
      window.updateMovementCalendarStrip();
    }
    if (window.lucide) lucide.createIcons();
    } finally {
      window.__isRenderingMovementMatches = false;
    }
  };`;

if (content.includes(oldRenderMatches) && content.includes(oldRenderMatchesEnd)) {
  content = content.replace(oldRenderMatches, newRenderMatches);
  content = content.replace(oldRenderMatchesEnd, newRenderMatchesEnd);
  console.log('[FixOOM] 3. renderMovementMatches protected with recursion guard.');
} else {
  console.error('[FixOOM] ERROR: renderMovementMatches signatures not found!');
  process.exit(1);
}

// 4. Protect saveAdminGameState with re-entrancy lock
const oldSaveState = `  // Salva no storage e atualiza ambas as listas de forma instantânea e fluida
  window.saveAdminGameState = function() {
    try {
      localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
      localStorage.setItem('arena-limoeiro-games-prototype-v2', JSON.stringify(window.adminGameState.bookings));
    } catch(e) {}
    if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
    if (typeof window.renderMovementMatches === "function") window.renderMovementMatches();
    if (typeof window.renderCadastrosBookingsList === "function") window.renderCadastrosBookingsList();
  };`;

const newSaveState = `  // Salva no storage e atualiza ambas as listas de forma instantânea e fluida
  window.saveAdminGameState = function() {
    if (window.__isSavingAdminState) return;
    window.__isSavingAdminState = true;
    try {
      localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
      localStorage.setItem('arena-limoeiro-games-prototype-v2', JSON.stringify(window.adminGameState.bookings));
    } catch(e) {}
    try {
      if (window.__matchesCacheByDate) window.__matchesCacheByDate.clear();
      if (typeof window.renderMovementMatches === "function") window.renderMovementMatches();
      if (typeof window.renderCadastrosBookingsList === "function") window.renderCadastrosBookingsList();
    } finally {
      window.__isSavingAdminState = false;
    }
  };`;

if (content.includes(oldSaveState)) {
  content = content.replace(oldSaveState, newSaveState);
  console.log('[FixOOM] 4. saveAdminGameState protected with re-entrancy lock.');
} else {
  console.error('[FixOOM] ERROR: oldSaveState not found!');
  process.exit(1);
}

fs.writeFileSync(filePath, content, 'utf8');

// Validate syntax
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  try {
    new vm.Script(match[1]);
  } catch (err) {
    console.error(`Syntax error in script ${count}:`, err.message);
    process.exit(1);
  }
}

console.log(`[FixOOM] ALL ${count} scripts validated successfully with ZERO syntax errors!`);
