const fs = require('fs');

let s = fs.readFileSync('public/admin.html', 'utf8');
const isCRLF = s.includes('\r\n');
if (isCRLF) s = s.replace(/\r\n/g, '\n');

// 1. Refactor saveFinishGame
const oldSaveFinishMatch = s.match(/window\.saveFinishGame = function\(e\) \{[\s\S]*?window\.closeArenaModal = function\(id\)/);

if (!oldSaveFinishMatch) {
  console.error('Could not match window.saveFinishGame');
  process.exit(1);
}

const newSaveFinishGame = `window.saveFinishGame = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('finishMatchId')?.value;
    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    if (!g) return;

    const late = parseInt(document.getElementById('finishMatchLate')?.value || 0, 10);
    const extraTime = parseInt(document.getElementById('finishMatchExtra')?.value || 0, 10);
    const origin = document.getElementById('finishMatchOrigin')?.value || 'Marcado no Balcão';
    const payMode = document.getElementById('finishPaymentMode')?.value || 'single';
    const payStatus = document.getElementById('finishPaymentStatus')?.value || 'Pago';
    const obs = document.getElementById('finishMatchObs')?.value.trim() || '';
    const ballReturned = document.getElementById('finishBallReturned')?.checked !== false;

    const basePrice = parseFloat(document.getElementById('finishBasePrice')?.value || 100);
    const hourlyRate = parseFloat(document.getElementById('finishHourlyRate')?.value || 100);
    const extraAmount = Math.round((extraTime / 60) * hourlyRate);
    const calculatedTotal = basePrice + extraAmount;

    let paymentFinalStr = '';
    let splitDetail = null;
    if (payMode === 'split') {
      const m1 = document.getElementById('splitMethod1')?.value || 'Dinheiro';
      const a1 = parseFloat(document.getElementById('splitAmount1')?.value || 0);
      const m2 = document.getElementById('splitMethod2')?.value || 'PIX';
      const a2 = parseFloat(document.getElementById('splitAmount2')?.value || 0);
      paymentFinalStr = m1 + ': R$ ' + a1.toFixed(2).replace('.', ',') + ' + ' + m2 + ': R$ ' + a2.toFixed(2).replace('.', ',');
      splitDetail = { m1, a1, m2, a2 };
      g.splitPayment = true;
      g.splitDetail = splitDetail;
    } else {
      paymentFinalStr = document.getElementById('finishMatchPayment')?.value || 'PIX';
      g.splitPayment = false;
      delete g.splitDetail;
    }

    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    // 1. Marca g como concluído
    g.status = 'finished';
    g.attendance = 'Finalizada';
    g.ballReturned = ballReturned;
    g.finishedAt = timeStr;
    g.late = late;
    g.extraTime = extraTime;
    g.extraAmount = extraAmount;
    g.booking_origin = origin;
    g.payment = (payStatus === 'Pago' ? paymentFinalStr : paymentFinalStr + ' (Pendente)');
    g.total_price = calculatedTotal;
    g.price = calculatedTotal;
    g.finishObs = obs;

    let logText = 'Partida concluída';
    if (ballReturned) logText += ' • Bola devolvida e conferida';
    if (extraTime > 0) logText += ' • ' + extraTime + 'm extra (+R$ ' + extraAmount + ')';
    if (late > 0) logText += ' • Atraso: ' + late + 'm';
    logText += ' • Total: R$ ' + calculatedTotal.toFixed(2) + ' • ' + g.payment + ' • ' + origin;
    if (obs) logText += ' (' + obs + ')';

    addMatchLog(g, 'Jogo concluído & Fechamento', logText);

    // 2. Localiza todas as referências cruzadas vinculadas ao mesmo slot/quadra
    const relatedIds = new Set([String(id), String(g.id)]);
    const targetCourt = (typeof getCourtById === 'function') ? getCourtById(g.court_id || g.courtId).id : g.court_id;

    (window.adminGameState.bookings || []).forEach(other => {
      if (!other) return;
      const otherCourt = (typeof getCourtById === 'function') ? getCourtById(other.court_id || other.courtId).id : other.court_id;
      const matchesSlot = (other.date === g.date && other.start_time === g.start_time && otherCourt === targetCourt);
      const matchesCustomer = (other.customer_name === g.customer_name && other.date === g.date);
      if (matchesSlot || matchesCustomer || String(other.id) === String(id) || String(other.id) === String(g.id)) {
        other.status = 'finished';
        other.attendance = 'Finalizada';
        other.ballReturned = ballReturned;
        other.finishedAt = timeStr;
        other.total_price = calculatedTotal;
        relatedIds.add(String(other.id));
      }
    });

    // 3. Efeito visual imediato: remove do DOM todos os cards associados instantaneamente
    relatedIds.forEach(rId => {
      const el = document.getElementById('card-' + rId);
      if (el) {
        el.style.display = 'none';
        el.remove();
      }
    });

    // 4. Salva no localStorage local
    try {
      localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
      localStorage.setItem('arena-limoeiro-games-prototype-v2', JSON.stringify(window.adminGameState.bookings));
    } catch(e) {}

    // 5. ☁️ Envia a finalização imediatamente para os 2 Bancos de Dados na Nuvem (Dual-Write)
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
      relatedIds.forEach(rId => {
        if (rId !== String(g.id)) {
          const relB = (window.adminGameState.bookings || []).find(b => String(b.id) === rId);
          if (relB) window.syncBookingToCloud(relB, 'upsert');
        }
      });
    }

    closeArenaModal('arenaFinishModal');

    // 6. Atualiza a tela operacional imediatamente: o jogo concluído some da lista
    if (typeof window.renderMovementMatches === "function") window.renderMovementMatches();
    if (typeof window.renderCadastrosBookingsList === "function") window.renderCadastrosBookingsList();

    // 7. Mostra e destaca o Próximo Jogo da Hora
    const dateStr = window.adminGameState.selectedDate || '2026-11-03';
    const activeList = (typeof window.getMatchesForDate === 'function')
      ? window.getMatchesForDate(dateStr).filter(m => m.status !== 'finished')
      : [];

    if (activeList.length > 0) {
      const next = activeList[0];
      const nextName = next.customer_name || next.name || 'Próxima Equipe';
      const nextTime = next.start_time || '';
      const nextCourt = next.court_name || 'Quadra';
      arenaToast('✓ Jogo concluído! Próximo jogo da hora: ' + nextName + ' às ' + nextTime + ' (' + nextCourt + ')');

      const nextEl = document.getElementById('card-' + next.id);
      if (nextEl) {
        nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nextEl.style.transition = 'box-shadow 0.4s ease';
        nextEl.style.boxShadow = '0 0 0 3px #10b981, 0 10px 25px -5px rgba(16, 185, 129, 0.35)';
        setTimeout(() => {
          if (nextEl) nextEl.style.boxShadow = '';
        }, 4000);
      }
    } else {
      arenaToast('✓ Partida finalizada com sucesso! Todos os jogos de hoje foram concluídos.');
    }
  };

  window.closeArenaModal = function(id)`;

s = s.replace(oldSaveFinishMatch[0], newSaveFinishGame);

// 2. Refactor pullDataFromCloudDatabases merging to protect finished games
const oldMergeBlock = `        cloudBookings.forEach(cb => {
          if (!cb || !cb.id) return;
          const existing = bMap.get(String(cb.id));
          if (existing) {
            // Preserva estado finalizado se já concluído na sessão
            if (existing.status === 'finished') cb.status = 'finished';
            bMap.set(String(cb.id), { ...existing, ...cb });
          } else {
            bMap.set(String(cb.id), cb);
          }
        });`;

const newMergeBlock = `        const finishedSlots = new Set();
        (window.adminGameState.bookings || []).forEach(b => {
          if (b && b.status === 'finished') {
            const cId = (typeof getCourtById === 'function') ? getCourtById(b.court_id || b.courtId).id : (b.court_id || '');
            finishedSlots.add(b.date + '_' + cId + '_' + b.start_time);
          }
        });

        cloudBookings.forEach(cb => {
          if (!cb || !cb.id) return;
          const cId = (typeof getCourtById === 'function') ? getCourtById(cb.court_id || cb.courtId).id : (cb.court_id || '');
          const slotKey = cb.date + '_' + cId + '_' + cb.start_time;
          const existing = bMap.get(String(cb.id));

          if ((existing && existing.status === 'finished') || finishedSlots.has(slotKey)) {
            cb.status = 'finished';
          }

          if (existing) {
            bMap.set(String(cb.id), { ...existing, ...cb, status: cb.status });
          } else {
            bMap.set(String(cb.id), cb);
          }
        });`;

s = s.replace(oldMergeBlock, newMergeBlock);

if (isCRLF) s = s.replace(/\n/g, '\r\n');
fs.writeFileSync('public/admin.html', s, 'utf8');
console.log('public/admin.html updated successfully!');
