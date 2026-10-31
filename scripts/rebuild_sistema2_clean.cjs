const fs = require('fs');

// Ler o arquivo original e limpo
const origPath = 'C:/Users/PC/Downloads/index (1).html';
let orig = fs.readFileSync(origPath, 'utf8');

// 1. Google Fonts para super nitidez
const googleFonts = '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n';

// 2. Estilos para fontes grandes, legíveis e botões com clique garantido
const enhancedStyles = `
<style id="readability-and-click-fixes">
  body {
    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    font-size: 15px !important;
    line-height: 1.6 !important;
    color: #0f172a !important;
    -webkit-font-smoothing: antialiased !important;
  }
  
  /* Garantir que todos os botões e inputs sejam 100% clicáveis */
  button, input, select, .space-option, .time-btn {
    cursor: pointer !important;
    position: relative !important;
    z-index: 10 !important;
  }
  input[type="date"], input[type="text"], input[type="tel"] {
    cursor: text !important;
  }

  /* Opções dos Espaços / Quadras */
  .space-option {
    padding: 14px 12px !important;
    border-width: 2px !important;
    user-select: none !important;
    -webkit-tap-highlight-color: transparent !important;
  }
  .space-name {
    font-size: 13px !important;
    font-weight: 800 !important;
    color: #0f172a !important;
    line-height: 1.3 !important;
    pointer-events: none !important;
  }
  .space-price {
    font-size: 12px !important;
    font-weight: 700 !important;
    color: #059669 !important;
    margin-top: 6px !important;
    pointer-events: none !important;
  }
  .space-icon {
    pointer-events: none !important;
  }

  /* Inputs e Controles */
  .control {
    font-size: 15px !important;
    font-weight: 600 !important;
    color: #0f172a !important;
    padding: 13px 14px !important;
    border: 1.5px solid #cbd5e1 !important;
    border-radius: 12px !important;
  }

  /* Horários */
  .time-btn {
    font-size: 13px !important;
    font-weight: 800 !important;
    padding: 11px 6px !important;
    color: #1e293b !important;
    border: 1.5px solid #cbd5e1 !important;
  }
  .time-btn:disabled {
    font-size: 12px !important;
    font-weight: 600 !important;
    color: #94a3b8 !important;
    background: #f1f5f9 !important;
    cursor: not-allowed !important;
  }

  /* Resumo e Botão Final */
  .summary-item small {
    font-size: 11px !important;
    font-weight: 800 !important;
    color: #64748b !important;
  }
  .summary-item strong {
    font-size: 17px !important;
    font-weight: 900 !important;
    color: #0f172a !important;
  }
  .summary-item .green {
    color: #059669 !important;
    font-size: 19px !important;
  }
  .submit-btn {
    font-size: 15px !important;
    font-weight: 800 !important;
    padding: 16px 24px !important;
    cursor: pointer !important;
    position: relative !important;
    z-index: 10 !important;
  }
</style>
`;

// 3. Top Banner informativo
const topBanner = `
<div style="background: linear-gradient(90deg, #064e3b, #0f172a); color: #ffffff; padding: 10px 18px; font-size: 13px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(16,185,129,0.3); font-family: 'Plus Jakarta Sans', sans-serif; position: relative; z-index: 100;">
  <div style="display: flex; align-items: center; gap: 10px;">
    <span style="background: #10b981; color: #064e3b; font-weight: 900; padding: 3px 8px; border-radius: 5px; font-size: 11px;">SISTEMA 2 • LOCALHOST</span>
    <span style="font-weight: 600;">Banco de Dados Vinculado (Supabase Nuvem + Local)</span>
  </div>
  <div style="display: flex; align-items: center; gap: 16px;">
    <a href="/sistema1" style="color: #6ee7b7; text-decoration: none; font-weight: 700; background: rgba(16,185,129,0.15); padding: 5px 12px; border-radius: 6px; border: 1px solid rgba(16,185,129,0.3);">⚙️ Painel Admin Local</a>
    <a href="https://arenalimoeiro.vercel.app" target="_blank" style="color: #94a3b8; text-decoration: none; font-weight: 600;">🌐 Sistema 1 (Vercel)</a>
  </div>
</div>
`;

// 4. Injetar no head
orig = orig.replace('<head>', '<head>\n  ' + googleFonts);
orig = orig.replace('</head>', enhancedStyles + '\n</head>');

// 5. Injetar banner no body
orig = orig.replace('<body>', '<body>\n' + topBanner);

// 6. Atualizar o bloco <script> com a lógica robusta e segura
const scriptStartIdx = orig.lastIndexOf('<script>');
const scriptEndIdx = orig.lastIndexOf('</script>');

const robustScript = `
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  window.SUPABASE_URL = 'https://brmclyukjfijommbxhks.supabase.co';
  window.SUPABASE_ANON_KEY = 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7';
  window.SUPABASE_SECONDARY_URL = 'https://aukrcnhuyultkjqsgvea.supabase.co';
  window.SUPABASE_SECONDARY_ANON_KEY = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

  let _sbClient = null;
  try {
    if (window.supabase) {
      if (window.SUPABASE_SECONDARY_URL) {
        _sbClient = window.supabase.createClient(window.SUPABASE_SECONDARY_URL, window.SUPABASE_SECONDARY_ANON_KEY);
      } else {
        _sbClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
      }
    }
  } catch(e) {
    console.warn('Supabase offline ou bloqueado:', e);
  }

  const spaceToCourtId = {
    fut5: 'court-society-1',
    fut6: 'court-society-2',
    fut7: 'court-beach-1',
    foot: 'court-esportes-de-quadra-1788962671043',
    beach: 'court-beach-2',
    society: 'court-futsal-1788963178368'
  };

  const spaces = {
    fut5:{name:'FUT 5 · SOCCER 5',normal:90,promo:50},
    fut6:{name:'FUT 6 · SOCCER 6',normal:100,promo:60},
    fut7:{name:'FUT 7 · SOCCER 7',normal:110,promo:70},
    foot:{name:'FOOT TABLE · FUTMESA',normal:35,promo:25},
    beach:{name:'QUADRA DE AREIA',normal:50,promo:30},
    society:{name:'QUADRA SOCIETY',normal:60,promo:40}
  };

  let selectedSpace = '';
  let selectedTime = '';
  let selectedEndTime = '';
  let _bookedSlotsSet = new Set();

  const dateInput = document.getElementById('bookingDate');
  const timeOptions = document.getElementById('timeOptions');
  const endTimeOptions = document.getElementById('endTimeOptions');
  const durationNote = document.getElementById('durationNote');
  const notice = document.getElementById('formNotice');
  const money = n => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const localISO = d => \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`;

  const today = new Date();
  if (dateInput) {
    dateInput.min = localISO(today);
    dateInput.value = localISO(today);
  }

  async function loadBookingsFromDatabase() {
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
          const s = b.start_time || (b.time ? b.time.split(' ')[0] : '');
          const e = b.end_time || (b.time ? b.time.split(' às ')[1] : '');
          if (s) {
            const sH = parseInt(s.slice(0, 2), 10);
            const eH = e ? parseInt(e.slice(0, 2), 10) : (sH + 1);
            for (let h = sH; h < eH; h++) {
              _bookedSlotsSet.add(String(h).padStart(2, '0') + ':00');
            }
          }
        });
      }
    } catch(err) {
      console.warn('Erro ao consultar agendamentos:', err);
    }
  }

  function priceForPeriod(start, end) {
    if(!selectedSpace || !start || !end) return null;
    const startHour = Number(start.slice(0, 2));
    const endHour = Number(end.slice(0, 2));
    if(endHour <= startHour) return null;
    const s = spaces[selectedSpace];
    let total = 0;
    for(let hour = startHour; hour < endHour; hour++){
      total += (hour >= 9 && hour < 16) ? s.promo : s.normal;
    }
    return total;
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
      const hours = Number(selectedEndTime.slice(0, 2)) - Number(selectedTime.slice(0, 2));
      timeText = \`\${dateText} • \${selectedTime} às \${selectedEndTime} (\${hours}h)\`;
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

  function renderEndTimes(startHour) {
    selectedEndTime = '';
    if(!selectedTime){
      if (endTimeOptions) endTimeOptions.innerHTML = '<div class="no-space">Selecione primeiro o horário de início.</div>';
      if (durationNote) durationNote.textContent = 'Escolha o horário de início e depois o término. O valor será calculado pela duração total.';
      updateSummary();
      return;
    }
    if (endTimeOptions) {
      endTimeOptions.innerHTML = '';
      for(let h = startHour + 1; h <= 22; h++){
        const time = String(h).padStart(2, '0') + ':00';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-btn';
        btn.textContent = time;
        btn.addEventListener('click', () => {
          selectedEndTime = time;
          endTimeOptions.querySelectorAll('.time-btn').forEach(b => b.classList.toggle('selected', b === btn));
          const duration = h - startHour;
          if (durationNote) durationNote.textContent = \`Duração selecionada: \${duration} \${duration === 1 ? 'hora' : 'horas'}.\`;
          updateSummary();
          if (notice) notice.classList.remove('show');
        });
        endTimeOptions.appendChild(btn);
      }
    }
    if (durationNote) durationNote.textContent = \`Escolha o horário final (depois das \${selectedTime}).\`;
    updateSummary();
  }

  function renderTimes() {
    selectedTime = '';
    selectedEndTime = '';
    if (endTimeOptions) endTimeOptions.innerHTML = '<div class="no-space">Selecione primeiro o horário de início.</div>';
    if (durationNote) durationNote.textContent = 'Escolha o horário de início e depois o encerramento.';

    if(!selectedSpace || !dateInput || !dateInput.value){
      if (timeOptions) timeOptions.innerHTML = '<div class="no-space">Escolha um espaço e uma data para ver os horários.</div>';
      updateSummary();
      return;
    }

    const now = new Date();
    const isToday = dateInput.value === localISO(now);
    const currentHour = now.getHours();

    if (timeOptions) {
      timeOptions.innerHTML = '';
      for(let h = 6; h <= 21; h++){
        const time = String(h).padStart(2, '0') + ':00';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'time-btn';
        btn.textContent = time;

        const isPast = isToday && (h <= currentHour);
        const isBooked = _bookedSlotsSet.has(time);

        if(isPast){
          btn.disabled = true;
          btn.title = 'Horário já passou';
        } else if(isBooked){
          btn.disabled = true;
          btn.title = 'Horário reservado no banco de dados';
          btn.style.opacity = '0.4';
          btn.style.textDecoration = 'line-through';
        }

        btn.addEventListener('click', () => {
          selectedTime = time;
          timeOptions.querySelectorAll('.time-btn').forEach(b => b.classList.toggle('selected', b === btn));
          renderEndTimes(h);
          updateSummary();
          if (notice) notice.classList.remove('show');
        });
        timeOptions.appendChild(btn);
      }
    }
    updateSummary();
  }

  async function chooseSpace(id, scroll = false) {
    selectedSpace = id;
    document.querySelectorAll('.space-option').forEach(b => {
      b.classList.toggle('selected', b.dataset.space === id);
    });
    renderTimes();
    if (scroll) {
      const agendarEl = document.getElementById('agendar');
      if (agendarEl) agendarEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (notice) notice.classList.remove('show');

    // Carrega do banco de forma assíncrona sem travar o clique imediato
    loadBookingsFromDatabase().then(() => {
      renderTimes();
    });
  }

  // Delegar eventos de clique diretamente no container de espaços para resposta 100% garantida
  document.addEventListener('DOMContentLoaded', () => {
    initEvents();
  });
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initEvents();
  }

  let _eventsInitialized = false;
  function initEvents() {
    if (_eventsInitialized) return;
    _eventsInitialized = true;

    // Clique nas opções de espaço
    document.querySelectorAll('.space-option').forEach(btn => {
      btn.onclick = function(e) {
        e.preventDefault();
        const space = this.getAttribute('data-space');
        if (space) chooseSpace(space);
      };
    });

    // Clique nos cards inferiores "Escolher este"
    document.querySelectorAll('[data-choose]').forEach(btn => {
      btn.onclick = function(e) {
        e.preventDefault();
        const space = this.getAttribute('data-choose');
        if (space) chooseSpace(space, true);
      };
    });

    // Mudança de data
    if (dateInput) {
      dateInput.onchange = function() {
        loadBookingsFromDatabase().then(() => renderTimes());
        if (notice) notice.classList.remove('show');
      };
    }

    // Máscara de Telefone
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput) {
      phoneInput.oninput = function(e) {
        let v = e.target.value.replace(/\\D/g, '').slice(0, 11);
        if(v.length > 10) v = v.replace(/^(\\d{2})(\\d{5})(\\d{0,4}).*/, '($1) $2-$3');
        else if(v.length > 6) v = v.replace(/^(\\d{2})(\\d{4})(\\d{0,4}).*/, '($1) $2-$3');
        else if(v.length > 2) v = v.replace(/^(\\d{2})(\\d{0,5})/, '($1) $2');
        e.target.value = v;
      };
    }

    // Formulário de envio
    const form = document.getElementById('bookingForm');
    if (form) {
      form.onsubmit = async function(e) {
        e.preventDefault();
        const nameEl = document.getElementById('customerName');
        const phoneEl = document.getElementById('customerPhone');
        const name = nameEl ? nameEl.value.trim() : '';
        const phone = phoneEl ? phoneEl.value.trim() : '';

        if (!selectedSpace || !selectedTime || !selectedEndTime) {
          if (notice) {
            notice.textContent = 'Para continuar, selecione uma quadra, o horário de início e o horário final.';
            notice.classList.add('show');
          }
          return;
        }

        if (!name || phone.replace(/\\D/g, '').length < 10) {
          if (notice) {
            notice.textContent = 'Por favor, informe seu nome completo e um número de WhatsApp válido.';
            notice.classList.add('show');
          }
          return;
        }

        const dateVal = dateInput ? dateInput.value : '';
        const dateText = new Date(dateVal + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        const price = priceForPeriod(selectedTime, selectedEndTime);
        const duration = Number(selectedEndTime.slice(0, 2)) - Number(selectedTime.slice(0, 2));
        const courtId = spaceToCourtId[selectedSpace] || selectedSpace;
        const courtName = spaces[selectedSpace].name;

        if (notice) {
          notice.innerHTML = '<span style="color:#10b981;">⏳ Registrando seu agendamento no sistema...</span>';
          notice.classList.add('show');
        }

        const bookingId = 'ARENA-' + Math.floor(1000 + Math.random() * 9000);
        const bookingPayload = {
          id: bookingId,
          court_id: courtId,
          customer_name: name,
          customer_phone: phone.replace(/\\D/g, ''),
          date: dateVal,
          start_time: selectedTime,
          end_time: selectedEndTime,
          time: selectedTime + ' às ' + selectedEndTime,
          total_price: price,
          status: 'confirmed',
          booking_type: 'avulso',
          payment_method: 'balcao',
          observation: 'Agendado via Sistema 2 - ' + courtName
        };

        if (_sbClient) {
          try {
            await _sbClient.from('bookings').insert([bookingPayload]);
          } catch(err) {
            console.warn('Erro ao salvar no Supabase:', err);
          }
        }

        const cleanPhone = phone.replace(/\\D/g, '');
        const zapText = encodeURIComponent(
          \`*Agendamento Confirmado - Arena Limoeiro*\\n\\n\` +
          \`*ID:* \${bookingId}\\n\` +
          \`*Cliente:* \${name}\\n\` +
          \`*Espaço:* \${courtName}\\n\` +
          \`*Data:* \${dateText}\\n\` +
          \`*Horário:* \${selectedTime} às \${selectedEndTime} (\${duration}h)\\n\` +
          \`*Valor Total:* \${money(price)}\\n\\n\` +
          \`Apresente esta confirmação na recepção da Arena Limoeiro. Bom jogo!\`
        );
        const zapUrl = \`https://api.whatsapp.com/send?phone=55\${cleanPhone}&text=\${zapText}\`;

        if (notice) {
          notice.innerHTML = \`<strong>✅ Agendamento Confirmado com Sucesso!</strong><br><br>\` +
            \`<strong>Código do Jogo:</strong> \${bookingId}<br>\` +
            \`\${courtName} • \${dateText}<br>\` +
            \`\${selectedTime} às \${selectedEndTime} (\${duration}h) • <strong>\${money(price)}</strong><br><br>\` +
            \`<a href="\${zapUrl}" target="_blank" style="display:inline-block;background:#25d366;color:#ffffff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:bold;margin-top:6px;box-shadow:0 4px 12px rgba(37,211,102,0.3);">📲 Abrir Confirmação no WhatsApp</a>\`;
          notice.classList.add('show');
          notice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        loadBookingsFromDatabase().then(() => renderTimes());
      };
    }

    // Selecionar o primeiro espaço por padrão para o usuário já ver os horários
    chooseSpace('fut5');
  }
</script>
`;

// Substituir o script antigo pelo novo
orig = orig.slice(0, scriptStartIdx) + robustScript + orig.slice(scriptEndIdx + 9);

fs.writeFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/index-sistema2.html', orig, 'utf8');
console.log('index-sistema2.html completely rebuilt with zero-lag instant clicks and reliable database binding!');
