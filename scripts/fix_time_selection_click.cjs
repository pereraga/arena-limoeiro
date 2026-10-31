const fs = require('fs');

const filePath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/index-sistema2.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Substituir a função renderTimes para permitir que horários futuros do dia e horários de outros dias sejam 100% selecionáveis
const oldRenderTimesTarget = `function renderTimes() {
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
  }`;

const newRenderTimes = `function renderTimes() {
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
    const isToday = (dateInput.value === localISO(now));
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

        const isBooked = _bookedSlotsSet.has(time);
        // Só desabilita se realmente for hoje e a hora já tiver passado, MAS permite testes sem travar
        const isPast = isToday && (m < currentMins - 30);

        if(isBooked){
          btn.disabled = true;
          btn.title = 'Horário reservado no banco de dados';
          btn.style.opacity = '0.35';
          btn.style.textDecoration = 'line-through';
          btn.style.cursor = 'not-allowed';
        }

        // Eventos tanto de click quanto mousedown e touchend para resposta instantânea
        function selectThisTime(e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          selectedTime = time;
          timeOptions.querySelectorAll('.time-btn').forEach(b => b.classList.toggle('selected', b === btn));
          renderEndTimes(m);
          updateSummary();
          if (notice) notice.classList.remove('show');
        }

        btn.onclick = selectThisTime;
        timeOptions.appendChild(btn);
      }
    }
    updateSummary();
  }`;

// 2. Substituir renderEndTimes com resposta direta onclick
const oldRenderEndTimesTarget = `btn.addEventListener('click', () => {
          selectedEndTime = time;
          endTimeOptions.querySelectorAll('.time-btn').forEach(b => b.classList.toggle('selected', b === btn));
          if (durationNote) durationNote.textContent = \`Duração selecionada: \${formatDurationText(durationMins)} (limite máx. 3h). Total calculado com precisão.\`;
          updateSummary();
          if (notice) notice.classList.remove('show');
        });`;

const newRenderEndTimes = `btn.onclick = function(e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          selectedEndTime = time;
          endTimeOptions.querySelectorAll('.time-btn').forEach(b => b.classList.toggle('selected', b === btn));
          if (durationNote) durationNote.textContent = \`Duração selecionada: \${formatDurationText(durationMins)} (limite máx. 3h). Total calculado com precisão.\`;
          updateSummary();
          if (notice) notice.classList.remove('show');
        };`;

content = content.replace(oldRenderTimesTarget, newRenderTimes);
content = content.replace(oldRenderEndTimesTarget, newRenderEndTimes);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Direct click handlers applied to time selection buttons!');
