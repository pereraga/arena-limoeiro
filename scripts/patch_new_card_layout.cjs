const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Ensure Font Awesome 6 is in <head>
if (!content.includes('font-awesome/6.4.0/css/all.min.css')) {
  content = content.replace(
    '</head>',
    '  <!-- Font Awesome 6 Icons -->\n  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n</head>'
  );
  console.log('Added Font Awesome 6 link to <head>.');
}

// 2. Ensure CSS classes (.smooth-shadow, .emerald-glow, .pulse-dot) are in <style>
if (!content.includes('.pulse-dot {')) {
  const customCss = `
    /* Suavizações e animações do Cartão Operacional de Gestão */
    .smooth-shadow {
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 10px -3px rgba(0, 0, 0, 0.03);
    }
    .emerald-glow {
      box-shadow: 0 0 0 1px #10b981, 0 10px 25px -5px rgba(16, 185, 129, 0.25);
    }
    .pulse-dot {
      animation: pulseAnimation 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulseAnimation {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: .4; transform: scale(1.15); }
    }
  `;
  content = content.replace('</style>', `${customCss}\n  </style>`);
  console.log('Added .smooth-shadow, .emerald-glow, .pulse-dot CSS to <style>.');
}

// 3. Add helper functions: quickAddAtrasoCard, quickAddExtraCard, addCardTimelineNote
if (!content.includes('window.quickAddAtrasoCard =')) {
  const helperFns = `
  // =========================================================================
  // FUNÇÕES DE OPERAÇÃO RÁPIDA DO NOVO CARTÃO DE JOGO (ATRASO, EXTRA, NOTAS)
  // =========================================================================
  window.showNotification = function(msg) {
    if (typeof window.arenaToast === 'function') {
      window.arenaToast(msg);
    } else if (typeof window.showToast === 'function') {
      window.showToast(msg);
    } else {
      console.log('[ArenaNotification]', msg);
    }
  };

  window.quickAddAtrasoCard = function(id, mins) {
    const inputH = document.getElementById('input-delay-h-' + id);
    const inputM = document.getElementById('input-delay-m-' + id);
    let h = parseInt(inputH ? inputH.value : 0, 10) || 0;
    let m = parseInt(inputM ? inputM.value : 0, 10) || 0;
    m += mins;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m = m % 60;
    }
    if (inputH) inputH.value = h;
    if (inputM) inputM.value = m;
    if (typeof window.onGameDelayHMChange === 'function') {
      window.onGameDelayHMChange(id);
    }
    window.showNotification('Atraso ajustado em +' + mins + ' minutos.');
  };

  window.quickAddExtraCard = function(id, mins) {
    const inputH = document.getElementById('input-extra-h-' + id);
    const inputM = document.getElementById('input-extra-m-' + id);
    let h = parseInt(inputH ? inputH.value : 0, 10) || 0;
    let m = parseInt(inputM ? inputM.value : 0, 10) || 0;
    m += mins;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m = m % 60;
    }
    if (inputH) inputH.value = h;
    if (inputM) inputM.value = m;
    if (typeof window.onGameExtraHMChange === 'function') {
      window.onGameExtraHMChange(id);
    }
    window.showNotification('Horário extra adicionado (+' + mins + ' min). Total recalculado!');
  };

  window.addCardTimelineNote = function(id) {
    const input = document.getElementById('internal-note-input-' + id);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const g = (typeof window.getGame === 'function') ? window.getGame(id) : ((window.adminGameState.bookings || []).find(b => String(b.id) === String(id)));
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const noteEntry = { at: 'Nota da Recepção (' + nowTime + ')', text: text };

    if (g) {
      if (!Array.isArray(g.log)) g.log = [];
      g.log.push(noteEntry);
      if (typeof saveAdminGameState === 'function') saveAdminGameState();
      if (typeof window.syncBookingToCloud === 'function') window.syncBookingToCloud(g, 'upsert');
    }

    const container = document.getElementById('timeline-container-' + id);
    if (container) {
      const div = document.createElement('div');
      div.className = 'relative';
      div.innerHTML = \`
        <div class="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow"></div>
        <div class="text-xs">
          <span class="font-bold text-slate-800">\${noteEntry.at}</span>
          <span class="text-slate-500">— \${noteEntry.text}</span>
          <span class="text-[10px] text-slate-400 block sm:inline sm:ml-2">Agora</span>
        </div>
      \`;
      container.appendChild(div);
    }

    input.value = '';
    window.showNotification('Nota adicionada ao histórico da partida!');
  };
`;
  // Insert before window.renderMatchCardHtml
  const targetInsert = 'window.renderMatchCardHtml = renderMatchCardHtml;';
  content = content.replace(targetInsert, helperFns + '\n  ' + targetInsert);
  console.log('Added helper functions for quick operations and timeline.');
}

// 4. Update onGameExtraHMChange to synchronize all IDs
const oldExtraSnippet = `    const calcVal = document.getElementById('calc-val-' + id);
    if (calcVal) {
      calcVal.textContent = \`R$ \${totalCalculatedStr} • \${g.isMensalista ? 'Mensalidade Faturada' : (mins > 0 ? \`Base R$ \${basePrice.toFixed(2).replace('.', ',')} + Extra R$ \${extraAmountStr}\` : 'Avulso')}\`;
    }`;

const newExtraSnippet = `    const calcVal = document.getElementById('calc-val-' + id);
    if (calcVal) {
      calcVal.textContent = \`R$ \${totalCalculatedStr} • \${g.isMensalista ? 'Mensalidade Faturada' : (mins > 0 ? \`Base R$ \${basePrice.toFixed(2).replace('.', ',')} + Extra R$ \${extraAmountStr}\` : 'Avulso')}\`;
    }

    const calcTotalEl = document.getElementById('status-calc-total-' + id);
    if (calcTotalEl) {
      calcTotalEl.textContent = \`R$ \${totalCalculatedStr} • \${mins > 0 ? 'Pendente Extra' : 'Pago'}\`;
    }
    const calcDetailEl = document.getElementById('status-calc-detail-' + id);
    if (calcDetailEl) {
      calcDetailEl.textContent = mins > 0 
        ? \`Base R$ \${basePrice.toFixed(2).replace('.', ',')} + Extra (\${mins}m): R$ \${extraAmountStr}\` 
        : \`Valor contratado: R$ \${basePrice.toFixed(2).replace('.', ',')}\`;
    }
    const badgeCalc = document.getElementById('badge-calc-status-' + id);
    if (badgeCalc) {
      badgeCalc.className = \`text-[10px] font-bold \${mins > 0 ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'} px-1.5 py-0.5 rounded\`;
      badgeCalc.textContent = mins > 0 ? 'Pendente Extra' : 'Pago';
    }
    const mainPriceEl = document.getElementById('mainPriceDisplay-' + id);
    if (mainPriceEl) {
      mainPriceEl.textContent = \`R$ \${totalCalculatedStr}\`;
    }`;

if (content.includes(oldExtraSnippet)) {
  content = content.replace(oldExtraSnippet, newExtraSnippet);
  console.log('Updated onGameExtraHMChange to update all dynamic card calculation elements.');
}

// 5. Replace renderMatchCardHtml with the modern operational card
const startMatchFn = 'function renderMatchCardHtml(m, isNextUpcoming) {';
const startIdx = content.indexOf(startMatchFn);

if (startIdx !== -1) {
  // Find the end of renderMatchCardHtml
  // It returns `...` and ends with `  }` before `  // =========================================================================\n  // GESTÃO DA ABA MOVIMENTAÇÃO`
  const endMarker = '  // =========================================================================\n  // GESTÃO DA ABA MOVIMENTAÇÃO';
  const endIdx = content.indexOf(endMarker, startIdx);

  if (endIdx !== -1) {
    const newRenderFn = `function renderMatchCardHtml(m, isNextUpcoming) {
    const isPanelOpen = !!(window.__openDetailsIds && window.__openDetailsIds.has(String(m.id)));
    const court = (typeof getCourtById === 'function') ? getCourtById(m.court_id || m.courtId) : { name: 'Quadra Central', normal: 100 };
    const startT = m.start_time || m.start || (m.time ? m.time.split(' ')[0] : '18:00');
    const endT = m.end_time || m.end || (m.time && m.time.includes('às') ? m.time.split('às')[1].trim() : '19:00');
    const durStr = (typeof calcDuration === 'function') ? calcDuration(startT, endT) : '1h';

    const isMensalista = m.isMensalista || m.type === 'Mensalista' || m.booking_type === 'mensalista';
    const typeLabel = isMensalista ? 'Mensalista VIP' : (m.type || m.booking_type || 'Avulso');
    
    const cleanPhone = (m.customer_phone || m.phone || '').replace(/\\D/g, '');
    const phoneDisplay = (typeof formatPhone === 'function') ? formatPhone(m.customer_phone || m.phone) : (m.customer_phone || m.phone || '(81) 9958-1034');
    const zapText = encodeURIComponent('Olá ' + (m.customer_name || m.name) + '! Confirmamos seu jogo na ' + court.name + ' às ' + startT + ' na Arena Limoeiro.');
    const zapUrl = cleanPhone.length >= 10 ? 'https://wa.me/55' + cleanPhone + '?text=' + zapText : '#';

    const mDate = m.date || (window.adminGameState && window.adminGameState.selectedDate) || ((typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-04');
    const todayStr = (typeof window.getSystemToday === 'function') ? window.getSystemToday() : '2026-11-04';
    const isFutureDay = mDate > todayStr;
    const isPastDay = mDate < todayStr;
    const isToday = mDate === todayStr;

    const st = m.status || 'confirmed';

    // Status classes and labels
    let statusBadgeClass = 'bg-blue-50 text-blue-700 border border-blue-200';
    let statusIcon = 'fa-circle-check';
    let statusLabel = 'Confirmado';
    let statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-blue-600';
    let statusInlineText = 'Confirmado • Pronto para iniciar (Início às ' + startT + ')';
    let statusInlineTextColor = 'text-blue-700';

    if (st === 'finished') {
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
      statusInlineTextColor = 'text-rose-700';
    } else if (st === 'no-show') {
      statusBadgeClass = 'bg-rose-50 text-rose-700 border border-rose-200';
      statusIcon = 'fa-user-slash';
      statusLabel = 'Não compareceu';
      statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-rose-600';
      statusInlineText = 'Não compareceu (No-Show registrado)';
      statusInlineTextColor = 'text-rose-700';
    } else if (st === 'live' || st === 'playing' || st === 'in_progress') {
      statusBadgeClass = 'bg-emerald-50 text-emerald-800 border border-emerald-300';
      statusIcon = 'fa-futbol';
      statusLabel = 'Em andamento';
      statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot';
      statusInlineText = 'Em Andamento • Bola Rolando na Quadra ' + court.name;
      statusInlineTextColor = 'text-emerald-700';
    } else if (isFutureDay) {
      statusBadgeClass = 'bg-blue-50 text-blue-700 border border-blue-200';
      statusIcon = 'fa-calendar';
      statusLabel = 'Confirmado';
      statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-blue-500';
      statusInlineText = 'Confirmado • Aguardando data do jogo (' + mDate + ')';
      statusInlineTextColor = 'text-blue-700';
    } else if (isPastDay) {
      statusBadgeClass = 'bg-amber-50 text-amber-800 border border-amber-300';
      statusIcon = 'fa-triangle-exclamation';
      statusLabel = 'Pendente';
      statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-amber-500';
      statusInlineText = '⚠️ Data anterior · Pendente de finalização';
      statusInlineTextColor = 'text-amber-800';
    } else if (isToday) {
      const now = new Date();
      const currentM = now.getHours() * 60 + now.getMinutes();
      const parseMin = (s) => {
        if (!s) return 0;
        const p = s.split(':');
        return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
      };
      const sM = parseMin(startT);
      let eM = parseMin(endT);
      if (eM <= sM) eM += 24 * 60;
      if (currentM < sM) {
        statusInlineText = 'Confirmado • Pronto para iniciar (Início às ' + startT + ')';
      } else if (currentM <= eM) {
        statusBadgeClass = 'bg-emerald-50 text-emerald-800 border border-emerald-300';
        statusIcon = 'fa-futbol';
        statusLabel = 'Em andamento';
        statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot';
        statusInlineText = 'Em Andamento • Horário ativo na Quadra ' + court.name;
        statusInlineTextColor = 'text-emerald-700';
      } else {
        statusBadgeClass = 'bg-amber-50 text-amber-800 border border-amber-300';
        statusIcon = 'fa-clock';
        statusLabel = 'Tempo limite atingido';
        statusInlineDot = 'w-2.5 h-2.5 rounded-full bg-amber-500';
        statusInlineText = 'Tempo limite atingido • Aguardando fechamento';
        statusInlineTextColor = 'text-amber-800';
      }
    }

    const price = Number(m.total_price || m.price || 100).toFixed(2).replace('.', ',');
    const payment = m.payment || (m.payment_method ? (m.payment_method.includes('Pago') || m.payment_method.includes('PIX') ? 'Pago' : m.payment_method) : 'Pago');
    const playersCount = m.players || 14;
    const observation = m.observation || m.note || (m.dayFixed ? 'Horário Fixo Semanal (' + m.dayFixed + ')' : (isMensalista ? 'Horário Fixo Semanal (QUARTA)' : 'Reserva Confirmada'));
    
    const attendance = m.attendance || (['live', 'playing', 'in_progress'].includes(st) ? 'Em Quadra' : (st === 'finished' ? 'Finalizado' : (st === 'no-show' ? 'Não compareceu' : 'Aguardando chegada')));
    const attendanceIconColor = ['live', 'playing', 'in_progress'].includes(st) ? 'text-emerald-500' : (st === 'finished' ? 'text-slate-400' : (st === 'no-show' ? 'text-rose-500' : 'text-amber-500'));
    const attendanceTextColor = ['live', 'playing', 'in_progress'].includes(st) ? 'text-emerald-700' : (st === 'finished' ? 'text-slate-700' : (st === 'no-show' ? 'text-rose-600' : 'text-amber-600'));
    const attendanceDotColor = ['live', 'playing', 'in_progress'].includes(st) ? 'bg-emerald-500 pulse-dot' : (st === 'finished' ? 'bg-slate-400' : (st === 'no-show' ? 'bg-rose-500' : 'bg-amber-500'));
    const attendanceSubtext = ['live', 'playing', 'in_progress'].includes(st) ? 'Equipe jogando na quadra' : (st === 'finished' ? 'Quadra liberada' : (st === 'no-show' ? 'Ausência registrada' : (m.checkinAt ? 'Chegou às ' + m.checkinAt : 'Abertura de portão 15m antes')));

    const lateMin = Number(m.late || 0);
    const lateH = Math.floor(lateMin / 60);
    const lateM = lateMin % 60;
    const extraMin = Number(m.extraTime || m.extra_minutes || 0);
    const extraH = Math.floor(extraMin / 60);
    const extraM = extraMin % 60;
    const extraAmount = Number(m.extraAmount || 0);
    const basePriceNum = parseFloat(m.total_price || m.price || 100);
    const hourlyRateCourt = (court && court.normal) ? court.normal : 100;
    const computedExtraAmount = extraAmount > 0 ? extraAmount : (extraMin > 0 ? Math.round((extraMin / 60) * hourlyRateCourt) : 0);
    const currentTotalNum = basePriceNum + computedExtraAmount;
    const currentTotalStr = currentTotalNum.toFixed(2).replace('.', ',');
    const computedExtraAmountStr = computedExtraAmount > 0 ? computedExtraAmount.toFixed(2).replace('.', ',') : '0,00';

    let originDisplay = m.booking_origin;
    if (!originDisplay) {
      if (isMensalista) originDisplay = 'Mensalista';
      else if (String(m.id).startsWith('ARENA-B')) originDisplay = 'Marcado no Balcão';
      else if (String(m.id).startsWith('game-')) originDisplay = 'Avulso';
      else originDisplay = 'WhatsApp Oficial';
    }

    const logs = Array.isArray(m.log) && m.log.length > 0 ? m.log : [
      { at: 'Reserva cadastrada', text: observation }
    ];

    const matchTimer = (typeof window.calcMatchTimer === 'function') 
      ? window.calcMatchTimer(startT, endT, extraMin, st, mDate) 
      : { percent: 0, label: 'Início automático às ' + startT, counter: durStr, fillClass: '', badgeClass: '' };

    const timerBarColor = matchTimer.fillClass === 'timer-fill-red' 
      ? 'bg-red-600' 
      : (matchTimer.fillClass === 'timer-fill-warn' 
        ? 'bg-amber-500' 
        : (matchTimer.fillClass === 'timer-fill-finished' 
          ? 'bg-slate-400' 
          : 'bg-gradient-to-r from-emerald-500 to-teal-400'));

    const showNextUpcomingBadge = isNextUpcoming && isToday;

    return \`
      <article class="booking-card \${showNextUpcomingBadge ? 'is-next-upcoming' : ''} bg-white rounded-3xl border border-emerald-500/40 smooth-shadow p-5 sm:p-7 relative overflow-hidden transition-all duration-300 mb-5" id="card-\${m.id}" style="\${showNextUpcomingBadge ? 'border: 2px solid #10b981 !important; box-shadow: 0 4px 16px -2px rgba(16, 185, 129, 0.22) !important;' : ''}">
        
        <!-- Barra sutil superior indicativa de status -->
        <div class="absolute top-0 left-0 right-0 h-1.5 \${st === 'finished' ? 'bg-slate-400' : 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600'}"></div>

        <!-- CABEÇALHO DO JOGO: HORÁRIO, DADOS DO CLIENTE & VALOR -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pb-5 border-b border-slate-100">
          
          <!-- Bloco 1: Cartão de Horário (Destaque visual menta) -->
          <div class="lg:col-span-3 sm:max-w-xs w-full bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 rounded-2xl p-4 border border-emerald-200/60 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div class="absolute -right-3 -top-3 w-16 h-16 bg-emerald-400/10 rounded-full blur-xl pointer-events-none"></div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                Horário Reservado
              </span>
              <span class="text-xs font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                <i class="fa-regular fa-clock text-[10px] mr-1 text-emerald-600"></i> \${durStr}
              </span>
            </div>

            <div class="my-3">
              <div class="text-3xl font-extrabold text-slate-900 tracking-tight font-heading flex items-baseline gap-1">
                \${startT}
                <span class="text-sm font-semibold text-slate-500">até \${endT}</span>
              </div>
              <div class="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
                <i class="fa-solid fa-calendar-day text-emerald-600 text-[11px]"></i> \${observation}
              </div>
            </div>

            <!-- Cronômetro em tempo real do jogo -->
            <div class="pt-2 border-t border-emerald-200/50 flex items-center justify-between text-xs">
              <span class="text-slate-500 font-medium">Tempo Restante:</span>
              <span id="countdown-\${m.id}" class="font-mono font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">\${matchTimer.counter}</span>
            </div>
          </div>

          <!-- Bloco 2: Badges, Nome do Cliente e Acesso Rápido -->
          <div class="lg:col-span-6 space-y-3">
            <!-- Badges em linha sem quebra irregular -->
            <div class="flex flex-wrap items-center gap-2">
              \${showNextUpcomingBadge ? \`
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
                <span class="w-2 h-2 rounded-full bg-emerald-200 pulse-dot"></span>
                ⚡ Próximo Jogo da Hora
              </span>
              \` : ''}

              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <i class="fa-solid fa-futbol text-[10px] text-emerald-600"></i> \${court.name}
              </span>

              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold \${statusBadgeClass}">
                <i class="fa-solid \${statusIcon} text-[10px]"></i> \${statusLabel}
              </span>

              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                <i class="fa-solid fa-star text-[10px] text-purple-600"></i> \${typeLabel}
              </span>

              \${extraMin > 0 ? \`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">+ \${extraMin}m extra</span>\` : ''}
              \${lateMin > 0 ? \`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">Atraso equipe: \${lateMin} min</span>\` : ''}
            </div>

            <!-- Nome e Detalhes do Cliente -->
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">\${m.customer_name || m.name}</h2>
                \${m.group_name ? \`<span class="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">\${m.group_name}</span>\` : ''}
              </div>

              <!-- Metadados em linha com ícones nítidos -->
              <div class="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
                <!-- Botão Direto para o WhatsApp -->
                <a href="\${zapUrl}" target="_blank" 
                   class="inline-flex items-center gap-1.5 text-emerald-700 font-semibold hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition">
                  <i class="fa-brands fa-whatsapp text-emerald-600 text-sm"></i> \${phoneDisplay}
                  <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-emerald-500 ml-0.5"></i>
                </a>

                <span class="flex items-center gap-1.5 font-medium text-slate-700">
                  <i class="fa-solid fa-users text-slate-400"></i> \${playersCount} jogadores previstos
                </span>

                <span class="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <i class="fa-solid fa-circle-check text-emerald-600"></i> \${payment}
                </span>
              </div>
            </div>

            <!-- Barra de Progresso Operacional da Partida -->
            <div class="pt-1 space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-slate-600 flex items-center gap-1.5">
                  <i class="fa-solid fa-stopwatch text-emerald-600"></i> \${matchTimer.label}
                </span>
                <span class="font-bold text-slate-700">\${matchTimer.counter}</span>
              </div>
              
              <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div class="h-full rounded-full transition-all duration-500 \${timerBarColor}" style="width: \${matchTimer.percent}%;"></div>
              </div>
            </div>

            <!-- Linha de Status e Toggle Retrátil "Detalhes e ações" -->
            <div class="flex items-center justify-between pt-2">
              <div class="text-xs font-semibold text-slate-700 flex items-center gap-2">
                Status:
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold \${statusInlineTextColor}">
                  <span class="\${statusInlineDot}"></span> \${statusInlineText}
                </span>
              </div>

              <!-- BOTÃO EXPANSÍVEL CONFORME A IMAGEM -->
              <button type="button" onclick="toggleDetails('\${m.id}')" class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition py-1 px-2.5 rounded-lg hover:bg-emerald-50 active:scale-95 cursor-pointer">
                <span>Detalhes e ações</span>
                <span id="arrow-details-\${m.id}" class="text-xs font-bold transition-transform duration-200">\${isPanelOpen ? '▴' : '▾'}</span>
              </button>
            </div>

          </div>

          <!-- Bloco 3: Valor Financeiro e Botão Principal -->
          <div class="lg:col-span-3 flex lg:flex-col items-end justify-between lg:justify-start gap-4">
            <div class="text-right">
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Valor Contratado</div>
              <div id="mainPriceDisplay-\${m.id}" class="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">R$ \${currentTotalStr}</div>
              <div class="flex items-center justify-end gap-1.5 mt-0.5">
                <span class="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <i class="fa-solid fa-check text-[9px] mr-1 text-emerald-600"></i> \${payment}
                </span>
              </div>
            </div>

            <!-- BOTÃO PRINCIPAL VISÍVEL: FINALIZAR (VERMELHO) OU FINALIZADA + RECIBO -->
            <div class="w-full flex justify-end">
              \${st === 'finished' ? \`
                <div class="flex items-center gap-2">
                  <span class="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 shadow-sm inline-flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-check text-emerald-600"></i> Finalizada
                  </span>
                  <button type="button" onclick="viewReceipt('\${m.id}')" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer inline-flex items-center gap-1" title="Ver Recibo">
                    <i class="fa-solid fa-receipt text-slate-500"></i> Recibo
                  </button>
                </div>
              \` : \`
                <button type="button" onclick="openFinishGame('\${m.id}')" class="w-full sm:w-auto px-6 py-2.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 shadow-md shadow-red-600/30 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                  <i class="fa-solid fa-check text-[11px]"></i> Finalizar
                </button>
              \`}
            </div>
          </div>

        </div>

        <!-- SEÇÃO RECOLHÍVEL: DETALHES, AJUSTES DE TEMPO E OUTROS BOTÕES -->
        <div class="booking-expanded-panel \${isPanelOpen ? '' : 'hidden'}" id="details-\${m.id}" style="\${isPanelOpen ? 'display:block;' : 'display:none;'} margin-top: 1.25rem; padding-top: 1rem;">
          
          <!-- PAINEL MODULAR DE INFORMAÇÕES BÁSICAS (4 Cards de Resumo) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
            
            <!-- Card 1: Campo e Modalidade -->
            <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-300 transition group">
              <div class="flex items-center justify-between text-slate-400 mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider">Campo / Modalidade</span>
                <i class="fa-solid fa-futbol text-emerald-600 text-xs"></i>
              </div>
              <div class="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition">\${court.name}</div>
              <div class="text-[11px] text-slate-500 mt-0.5">\${court.type || 'Grama Sintética Profissional'}</div>
            </div>

            <!-- Card 2: Tipo de Reserva -->
            <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-300 transition group">
              <div class="flex items-center justify-between text-slate-400 mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider">Tipo de Reserva</span>
                <i class="fa-solid fa-id-card text-purple-600 text-xs"></i>
              </div>
              <div class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <i class="fa-solid fa-star text-purple-500 text-xs"></i> \${typeLabel}
              </div>
              <div class="text-[11px] text-slate-500 mt-0.5">\${isMensalista ? 'Contrato Mensalista Ativo' : 'Reserva Avulsa'}</div>
            </div>

            <!-- Card 3: Status de Presença -->
            <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-300 transition group">
              <div class="flex items-center justify-between text-slate-400 mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider">Presença em Quadra</span>
                <i class="fa-solid fa-user-clock \${attendanceIconColor} text-xs"></i>
              </div>
              <div class="font-bold \${attendanceTextColor} text-sm flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full \${attendanceDotColor}"></span> \${attendance}
              </div>
              <div class="text-[11px] text-slate-500 mt-0.5">\${attendanceSubtext}</div>
            </div>

            <!-- Card 4: Faturamento e Pagamento -->
            <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-300 transition group">
              <div class="flex items-center justify-between text-slate-400 mb-1">
                <span class="text-[10px] font-bold uppercase tracking-wider">Status Financeiro</span>
                <i class="fa-solid fa-receipt text-emerald-600 text-xs"></i>
              </div>
              <div class="font-bold text-emerald-700 text-sm">\${payment} • R$ \${price}</div>
              <div class="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                <span>Sem pendências</span>
                <a href="#" onclick="viewReceipt('\${m.id}'); return false;" class="text-emerald-600 font-semibold hover:underline">Ver Recibo</a>
              </div>
            </div>

          </div>

          <!-- ZONA DE AJUSTES OPERACIONAIS (ATRASO, EXTRA, ORIGEM, CÁLCULO) -->
          <div class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5">
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/60">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <i class="fa-solid fa-sliders text-emerald-600"></i> Painel de Ajustes Operacionais & Tempo
              </span>
              <span class="text-[11px] text-slate-500">Ajustes manuais e recálculo</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <!-- Bloco A: Tempo de Atraso -->
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold uppercase text-slate-500">Tempo de Atraso da Equipe</label>
                <div class="flex items-center gap-1.5">
                  <div class="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs w-full">
                    <input type="number" id="input-delay-h-\${m.id}" min="0" max="23" value="\${lateH > 0 ? lateH : '0'}" oninput="onGameDelayHMChange('\${m.id}')" class="w-8 text-center text-xs font-bold text-slate-800 focus:outline-none">
                    <span class="text-[11px] text-slate-400 mr-2">h</span>
                    <input type="number" id="input-delay-m-\${m.id}" min="0" max="59" step="5" value="\${lateM > 0 ? lateM : '0'}" oninput="onGameDelayHMChange('\${m.id}')" class="w-10 text-center text-xs font-bold text-slate-800 focus:outline-none">
                    <span class="text-[11px] text-slate-400">min</span>
                  </div>
                </div>
                <div class="flex items-center justify-between pt-0.5">
                  <div id="status-delay-\${m.id}" class="text-[11px] font-semibold \${lateMin > 0 ? 'text-rose-600' : 'text-emerald-600'} flex items-center gap-1">
                    \${lateMin > 0 ? \`<i class="fa-solid fa-clock text-[10px]"></i> Atraso de \${lateMin}min registrado\` : \`<i class="fa-solid fa-check text-[10px]"></i> Sem atraso (No horário)\`}
                  </div>
                  <div class="flex gap-1">
                    <button type="button" onclick="quickAddAtrasoCard('\${m.id}', 15)" class="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">+15m</button>
                    <button type="button" onclick="quickAddAtrasoCard('\${m.id}', 30)" class="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">+30m</button>
                  </div>
                </div>
              </div>

              <!-- Bloco B: Horário Extra -->
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold uppercase text-slate-500">Tempo de Horário Extra</label>
                <div class="flex items-center gap-1.5">
                  <div class="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs w-full">
                    <input type="number" id="input-extra-h-\${m.id}" min="0" max="23" value="\${extraH > 0 ? extraH : '0'}" oninput="onGameExtraHMChange('\${m.id}')" class="w-8 text-center text-xs font-bold text-slate-800 focus:outline-none">
                    <span class="text-[11px] text-slate-400 mr-2">h</span>
                    <input type="number" id="input-extra-m-\${m.id}" min="0" max="59" step="15" value="\${extraM > 0 ? extraM : '0'}" oninput="onGameExtraHMChange('\${m.id}')" class="w-10 text-center text-xs font-bold text-slate-800 focus:outline-none">
                    <span class="text-[11px] text-slate-400">min</span>
                  </div>
                </div>
                <div class="flex items-center justify-between pt-0.5">
                  <div id="status-extra-\${m.id}" class="text-[11px] \${extraMin > 0 ? 'font-bold text-amber-600' : 'text-slate-500'}">
                    \${extraMin > 0 ? \`+\${extraH > 0 ? extraH + 'h ' : ''}\${extraM}min (+R$ \${computedExtraAmountStr})\` : 'Sem tempo extra'}
                  </div>
                  <div class="flex gap-1">
                    <button type="button" onclick="quickAddExtraCard('\${m.id}', 30)" class="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">+30m</button>
                    <button type="button" onclick="quickAddExtraCard('\${m.id}', 60)" class="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer">+1h</button>
                  </div>
                </div>
              </div>

              <!-- Bloco C: Onde foi marcado (Origem) -->
              <div class="space-y-1.5">
                <label class="block text-[11px] font-bold uppercase text-slate-500">Onde foi marcado (Origem)</label>
                <select id="select-origin-\${m.id}" onchange="onGameOriginChange('\${m.id}', this.value)" class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer">
                  <option value="Mensalista" \${originDisplay.toLowerCase().includes('mensalista') ? 'selected' : ''}>Mensalista</option>
                  <option value="WhatsApp Oficial" \${originDisplay.toLowerCase().includes('whatsapp') ? 'selected' : ''}>WhatsApp Oficial</option>
                  <option value="Marcado no Balcão" \${originDisplay.toLowerCase().includes('balcão') ? 'selected' : ''}>Marcado no Balcão</option>
                  <option value="Aplicativo / Web" \${originDisplay.toLowerCase().includes('app') || originDisplay.toLowerCase().includes('web') ? 'selected' : ''}>Aplicativo / Web</option>
                  <option value="Avulso" \${originDisplay.toLowerCase().includes('avulso') ? 'selected' : ''}>Avulso</option>
                </select>
                <div class="text-[11px] text-slate-500" id="status-origin-\${m.id}">\${originDisplay}</div>
              </div>

              <!-- Bloco D: Cálculo Automático e Valor Total -->
              <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold uppercase text-slate-400">Cálculo Automático / Valor</span>
                  <span id="badge-calc-status-\${m.id}" class="text-[10px] font-bold \${extraMin > 0 ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'} px-1.5 py-0.5 rounded">
                    \${extraMin > 0 ? 'Pendente Extra' : 'Pago'}
                  </span>
                </div>
                <div>
                  <div id="status-calc-total-\${m.id}" class="text-xl font-extrabold text-slate-900 font-heading">R$ \${currentTotalStr} • \${extraMin > 0 ? 'Pendente Extra' : 'Pago'}</div>
                  <div id="status-calc-detail-\${m.id}" class="text-[10px] text-slate-500">
                    \${extraMin > 0 ? \`Base R$ \${price} + Extra (\${extraMin}m): R$ \${computedExtraAmountStr}\` : \`Valor contratado: R$ \${price}\`}
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- BOTÕES DE GESTÃO SECUNDÁRIA -->
          <div class="flex flex-wrap items-center justify-between gap-2.5 pb-3">
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" onclick="openEditGame('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-pencil text-slate-400"></i> Editar jogo
              </button>

              <button type="button" onclick="openContract('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-file-contract text-slate-400"></i> Editar contrato
              </button>

              \${st !== 'finished' ? \`
              <button type="button" onclick="startGameNow('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-play text-emerald-600"></i> Iniciar Jogo na Quadra
              </button>
              <button type="button" onclick="openFinishGame('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-check text-emerald-600"></i> Finalizar
              </button>
              \` : ''}
            </div>

            <div class="flex items-center gap-2">
              <button type="button" onclick="openNoShow('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-user-slash text-amber-500"></i> Não compareceu
              </button>

              <button type="button" onclick="cancelGame('\${m.id}')" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <i class="fa-solid fa-ban text-rose-500"></i> Cancelar partida
              </button>
            </div>
          </div>

          <!-- HISTÓRICO E LINHA DO TEMPO DA PARTIDA (TIMELINE) -->
          <div class="mt-4 pt-4 border-t border-slate-200">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <i class="fa-solid fa-timeline text-emerald-600"></i> Histórico desta partida
              </h3>
              <span class="text-[11px] text-slate-400">ID Reserva: #\${m.id}</span>
            </div>

            <!-- Timeline Container -->
            <div id="timeline-container-\${m.id}" class="space-y-2.5 relative pl-4 border-l-2 border-slate-200 ml-2">
              \${logs.map(log => \`
                <div class="relative">
                  <div class="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow"></div>
                  <div class="text-xs">
                    <span class="font-bold text-slate-800">\${log.at || 'Registro'}</span>
                    <span class="text-slate-500">— \${log.text || ''}</span>
                  </div>
                </div>
              \`).join('')}
            </div>

            <!-- Campo para adicionar anotação rápida da recepção -->
            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
              <input type="text" id="internal-note-input-\${m.id}" placeholder="Adicionar nota rápida (ex: 'Pediu 2 bolas extras e coletes amarelos')..." 
                class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500">
              <button type="button" onclick="addCardTimelineNote('\${m.id}')" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
                <i class="fa-solid fa-plus text-xs"></i> Registrar Nota
              </button>
            </div>

          </div>

        </div>

      </article>
    \`;
  }
`;
    content = content.substring(0, startIdx) + newRenderFn + '\n  ' + content.substring(endIdx);
    console.log('Successfully replaced renderMatchCardHtml with modern card layout.');
  } else {
    console.error('Could not find endMarker in admin.html');
  }
} else {
  console.error('Could not find startMatchFn in admin.html');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Saved updated public/admin.html.');
