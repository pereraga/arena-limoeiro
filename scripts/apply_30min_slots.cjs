const fs = require('fs');

const filePath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/index-sistema2.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Atualizar o CSS para acomodar os horários de 30 em 30 min com layout moderno e scroll agradável se necessário
const styleReplacement = `
  .time-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fill, minmax(78px, 1fr)) !important;
    gap: 8px !important;
    max-height: 260px !important;
    overflow-y: auto !important;
    padding: 4px 2px !important;
  }
  .time-grid::-webkit-scrollbar {
    width: 6px;
  }
  .time-grid::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  .time-btn {
    font-size: 13px !important;
    font-weight: 800 !important;
    padding: 10px 4px !important;
    color: #1e293b !important;
    border: 1.5px solid #cbd5e1 !important;
    border-radius: 10px !important;
    text-align: center !important;
  }
`;

content = content.replace('/* Horários */', '/* Horários */\n' + styleReplacement);

// 2. Substituir as funções de horários, cálculo de preço e banco de dados para suportar 30 em 30 min e limite de 3h
const oldLogicStart = content.indexOf('async function loadBookingsFromDatabase()');
const oldLogicEnd = content.indexOf('async function chooseSpace(');

const newLogic = `async function loadBookingsFromDatabase() {
    if (!selectedSpace || !dateInput || !dateInput.value) return;
    const courtId = spaceToCourtId[selectedSpace] || selectedSpace;
    const targetDate = dateInput.value;
    _bookedSlotsSet.clear();

    if (!_sbClient) return;
    try {
      const { data: bookings, error } = await _sbClient
        .from('bookings')
        .select('start_time, end_time, time, status')
        .eq('court_id', courtId)
        .eq('date', targetDate)
        .neq('status', 'cancelled');

      if (!error && Array.isArray(bookings)) {
        bookings.forEach(b => {
          let s = b.start_time || (b.time ? b.time.split(' ')[0] : '');
          let e = b.end_time || (b.time ? (b.time.includes(' às ') ? b.time.split(' às ')[1] : '') : '');
          if (s) {
            const [sh, sm] = s.split(':').map(Number);
            const startMins = sh * 60 + (sm || 0);
            let endMins = startMins + 60;
            if (e) {
              const [eh, em] = e.split(':').map(Number);
              endMins = eh * 60 + (em || 0);
            }
            for (let m = startMins; m < endMins; m += 30) {
              const slotTime = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
              _bookedSlotsSet.add(slotTime);
            }
          }
        });
      }
    } catch(err) {
      console.warn('Erro ao consultar agendamentos:', err);
    }
  }

  function timeToMins(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  function minsToTime(m) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
  }

  function priceForPeriod(start, end) {
    if(!selectedSpace || !start || !end) return null;
    const startMins = timeToMins(start);
    const endMins = timeToMins(end);
    if(endMins <= startMins) return null;
    const s = spaces[selectedSpace];
    let total = 0;
    
    // Cada bloco de 30 minutos custa metade do valor da hora naquele intervalo
    for(let m = startMins; m < endMins; m += 30) {
      const h = Math.floor(m / 60);
      const isPromo = (h >= 9 && h < 16);
      const hourlyRate = isPromo ? s.promo : s.normal;
      total += (hourlyRate / 2);
    }
    return Math.round(total * 100) / 100;
  }

  function formatDurationText(mins) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0 && remainingMins > 0) {
      return \`\${hours}h\${remainingMins}min\`;
    } else if (hours > 0) {
      return \`\${hours} \${hours === 1 ? 'hora' : 'horas'}\`;
    } else {
      return \`\${remainingMins} minutos\`;
    }
  }

  function updateSummary() {
    const spaceSummary = document.getElementById('summarySpace');
    const dateSummary = document.getElementById('summaryDate');
    const priceSummary = document.getElementById('summaryPrice');

    if (spaceSummary) spaceSummary.textContent = selectedSpace ? spaces[selectedSpace].name : 'Não selecionado';
    
    const dateVal = dateInput ? dateInput.value : '';
    const dateText = dateVal ? new Date(dateVal + 'T12:00:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', year:'numeric'}) : 'A definir';
    let timeText = 'A definir';
    if(selectedTime && selectedEndTime){
      const durationMins = timeToMins(selectedEndTime) - timeToMins(selectedTime);
      timeText = \`\${dateText} • \${selectedTime} às \${selectedEndTime} (\${formatDurationText(durationMins)})\`;
    } else if(selectedTime){
      timeText = \`\${dateText} • início às \${selectedTime}\`;
    } else if(dateVal){
      timeText = dateText;
    }
    if (dateSummary) dateSummary.textContent = timeText;

    const price = priceForPeriod(selectedTime, selectedEndTime);
    if (priceSummary) {
      priceSummary.textContent = price === null ? (selectedTime ? 'Defina o horário final' : 'R$ --') : money(price);
    }
  }

  function renderEndTimes(startMins) {
    selectedEndTime = '';
    if(!selectedTime){
      if (endTimeOptions) endTimeOptions.innerHTML = '<div class="no-space">Selecione primeiro o horário de início.</div>';
      if (durationNote) durationNote.textContent = 'Escolha o horário de início e depois o término (máximo de 3 horas).';
      updateSummary();
      return;
    }
    if (endTimeOptions) {
      endTimeOptions.innerHTML = '';
      
      // Limite: mínimo de 30 min e MÁXIMO de 3 horas (180 minutos)
      const maxMins = Math.min(startMins + 180, 22 * 60 + 30);

      for(let m = startMins + 30; m <= maxMins; m += 30){
        const time = minsToTime(m);
        const durationMins = m - startMins;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-btn';
        btn.textContent = time;

        btn.addEventListener('click', () => {
          selectedEndTime = time;
          endTimeOptions.querySelectorAll('.time-btn').forEach(b => b.classList.toggle('selected', b === btn));
          if (durationNote) durationNote.textContent = \`Duração selecionada: \${formatDurationText(durationMins)} (limite máx. 3h). Total calculado com precisão.\`;
          updateSummary();
          if (notice) notice.classList.remove('show');
        });
        endTimeOptions.appendChild(btn);
      }
    }
    if (durationNote) durationNote.textContent = \`Escolha o horário final (permitido de 30 minutos até 3 horas de jogo).\`;
    updateSummary();
  }

  function renderTimes() {
    selectedTime = '';
    selectedEndTime = '';
    if (endTimeOptions) endTimeOptions.innerHTML = '<div class="no-space">Selecione primeiro o horário de início.</div>';
    if (durationNote) durationNote.textContent = 'Intervalos de 30 em 30 min (máximo de 3 horas de jogo).';

    if(!selectedSpace || !dateInput || !dateInput.value){
      if (timeOptions) timeOptions.innerHTML = '<div class="no-space">Escolha um espaço e uma data para ver os horários.</div>';
      updateSummary();
      return;
    }

    const now = new Date();
    const isToday = dateInput.value === localISO(now);
    const currentMins = now.getHours() * 60 + now.getMinutes();

    if (timeOptions) {
      timeOptions.innerHTML = '';
      
      // De 06:00 até 22:00, a cada 30 minutos
      for(let m = 6 * 60; m <= 22 * 60; m += 30){
        const time = minsToTime(m);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-btn';
        btn.textContent = time;

        const isPast = isToday && (m <= currentMins);
        const isBooked = _bookedSlotsSet.has(time);

        if(isPast){
          btn.disabled = true;
          btn.title = 'Horário já passou';
        } else if(isBooked){
          btn.disabled = true;
          btn.title = 'Horário já reservado no banco de dados';
          btn.style.opacity = '0.4';
          btn.style.textDecoration = 'line-through';
        }

        btn.addEventListener('click', () => {
          selectedTime = time;
          timeOptions.querySelectorAll('.time-btn').forEach(b => b.classList.toggle('selected', b === btn));
          renderEndTimes(m);
          updateSummary();
          if (notice) notice.classList.remove('show');
        });
        timeOptions.appendChild(btn);
      }
    }
    updateSummary();
  }

  `;

content = content.slice(0, oldLogicStart) + newLogic + content.slice(oldLogicEnd);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Slots 30m and max 3 hours limit successfully applied to index-sistema2.html');
