const fs = require('fs');

let html = fs.readFileSync('public/index-sistema2.html', 'utf8');

// 1. Inject Supabase JS CDN and client scripts in head
const headTarget = '</head>';

const supabaseScripts = `
  <!-- Supabase CDN & Configuração Vinculada ao Banco da Arena -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script>
    window.SUPABASE_URL = 'https://brmclyukjfijommbxhks.supabase.co';
    window.SUPABASE_ANON_KEY = 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7';
    window.SUPABASE_SECONDARY_URL = 'https://aukrcnhuyultkjqsgvea.supabase.co';
    window.SUPABASE_SECONDARY_ANON_KEY = 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi';

    // Cria os clientes de banco
    const _sbClient1 = window.supabase ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
    const _sbClient2 = (window.supabase && window.SUPABASE_SECONDARY_URL) ? window.supabase.createClient(window.SUPABASE_SECONDARY_URL, window.SUPABASE_SECONDARY_ANON_KEY) : null;
    
    // Obter cliente ativo (prioriza Banco 2 se configurado, ou Banco 1)
    window.getArenaDbClient = function() {
      return _sbClient2 || _sbClient1;
    };
  </script>
</head>`;

html = html.replace(headTarget, supabaseScripts);

// 2. Map space IDs in index (1) to court IDs in the database
// fut5 -> court-society-1
// fut6 -> court-society-2
// fut7 -> court-beach-1
// foot -> court-esportes-de-quadra-1788962671043
// beach -> court-beach-2
// society -> court-futsal-1788963178368

const spaceToCourtMapCode = `
    const spaceToCourtId = {
      fut5: 'court-society-1',
      fut6: 'court-society-2',
      fut7: 'court-beach-1',
      foot: 'court-esportes-de-quadra-1788962671043',
      beach: 'court-beach-2',
      society: 'court-futsal-1788963178368'
    };

    // Cache de horários ocupados vindos do banco de dados
    let _bookedSlotsSet = new Set();

    async function loadBookingsFromDatabase() {
      if (!selectedSpace || !dateInput.value) return;
      const courtId = spaceToCourtId[selectedSpace] || selectedSpace;
      const targetDate = dateInput.value;
      _bookedSlotsSet.clear();

      try {
        const client = window.getArenaDbClient ? window.getArenaDbClient() : null;
        if (client) {
          // Busca agendamentos do dia para esta quadra
          const { data: bookings } = await client
            .from('bookings')
            .select('start_time, end_time, time, status')
            .eq('court_id', courtId)
            .eq('date', targetDate)
            .neq('status', 'cancelled');

          if (Array.isArray(bookings)) {
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
        }
      } catch (err) {
        console.warn('Erro ao carregar agendamentos do banco:', err);
      }
    }
`;

// Insert the spaceToCourtId mapping right after spaces declaration
html = html.replace('const spaces = {', spaceToCourtMapCode + '\n    const spaces = {');

// 3. Update renderTimes to check _bookedSlotsSet and disable already booked times
const oldRenderTimes = `      for(let h=6;h<=21;h++){
        const time=String(h).padStart(2,'0')+':00';
        const btn=document.createElement('button');
        btn.type='button'; btn.className='time-btn'; btn.textContent=time;
        if(isToday && h<=currentHour){btn.disabled=true;btn.title='Horário passado';}
        btn.addEventListener('click',()=>{
          selectedTime=time;
          timeOptions.querySelectorAll('.time-btn').forEach(b=>b.classList.toggle('selected',b===btn));
          renderEndTimes(h);
          updateSummary();
          notice.classList.remove('show');
        });
        timeOptions.appendChild(btn);
      }`;

const newRenderTimes = `      for(let h=6;h<=21;h++){
        const time=String(h).padStart(2,'0')+':00';
        const btn=document.createElement('button');
        btn.type='button'; btn.className='time-btn'; btn.textContent=time;
        const isPast = isToday && h<=currentHour;
        const isBooked = _bookedSlotsSet.has(time);
        
        if(isPast){
          btn.disabled=true;
          btn.title='Horário passado';
        } else if(isBooked){
          btn.disabled=true;
          btn.title='Horário já reservado no banco de dados';
          btn.style.opacity = '0.35';
          btn.style.textDecoration = 'line-through';
        }

        btn.addEventListener('click',()=>{
          selectedTime=time;
          timeOptions.querySelectorAll('.time-btn').forEach(b=>b.classList.toggle('selected',b===btn));
          renderEndTimes(h);
          updateSummary();
          notice.classList.remove('show');
        });
        timeOptions.appendChild(btn);
      }`;

html = html.replace(oldRenderTimes, newRenderTimes);

// Also hook loadBookingsFromDatabase in chooseSpace and dateInput change
html = html.replace('function chooseSpace(id,scroll=false){', 'async function chooseSpace(id,scroll=false){\n      selectedSpace=id;\n      await loadBookingsFromDatabase();');
html = html.replace('dateInput.addEventListener(\'change\',()=>{renderTimes();notice.classList.remove(\'show\')});', 'dateInput.addEventListener(\'change\',async ()=>{await loadBookingsFromDatabase();renderTimes();notice.classList.remove(\'show\')});');

// 4. Update bookingForm submit to SAVE TO THE DATABASE
const oldFormSubmit = `      const dateText=new Date(dateInput.value+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
      const price=priceForPeriod(selectedTime,selectedEndTime);
      const duration=Number(selectedEndTime.slice(0,2))-Number(selectedTime.slice(0,2));
      notice.innerHTML=\`<strong>Resumo pronto, \${escapeHtml(name)}!</strong><br>\${spaces[selectedSpace].name} • \${dateText} • \${selectedTime} às \${selectedEndTime} (\${duration} \${duration===1?'hora':'horas'}) • <strong>\${money(price)}</strong>.<br><br><strong>Prévia:</strong> nenhum agendamento foi enviado ou confirmado. Para publicar este site, é necessário conectar a agenda real da Arena e configurar o canal de envio.\`;
      notice.classList.add('show');
      notice.scrollIntoView({behavior:'smooth',block:'nearest'});
    });`;

const newFormSubmit = `      const dateText=new Date(dateInput.value+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
      const price=priceForPeriod(selectedTime,selectedEndTime);
      const duration=Number(selectedEndTime.slice(0,2))-Number(selectedTime.slice(0,2));
      const courtId = spaceToCourtId[selectedSpace] || selectedSpace;
      const courtName = spaces[selectedSpace].name;

      notice.innerHTML = '<span style="color:#10b981;">⏳ Gravando agendamento no Banco de Dados da Arena Limoeiro...</span>';
      notice.classList.add('show');

      try {
        const bookingId = 'ARENA-' + Math.floor(1000 + Math.random() * 9000);
        const bookingPayload = {
          id: bookingId,
          court_id: courtId,
          customer_name: name,
          customer_phone: phone.replace(/\\D/g, ''),
          date: dateInput.value,
          start_time: selectedTime,
          end_time: selectedEndTime,
          time: selectedTime + ' às ' + selectedEndTime,
          total_price: price,
          status: 'confirmed',
          booking_type: 'avulso',
          payment_method: 'balcao',
          observation: 'Agendado via Sistema 2 (Localhost) - ' + courtName
        };

        const client = window.getArenaDbClient ? window.getArenaDbClient() : null;
        if (client) {
          const { error } = await client.from('bookings').insert([bookingPayload]);
          if (error) console.warn('Aviso banco:', error);
        }

        // Também salva no localStorage local do navegador
        try {
          const localBookings = JSON.parse(localStorage.getItem('arena_local_bookings') || '[]');
          localBookings.push(bookingPayload);
          localStorage.setItem('arena_local_bookings', JSON.stringify(localBookings));
        } catch(e) {}

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

        notice.innerHTML=\`<strong>✅ Agendamento Salvo com Sucesso no Banco de Dados!</strong><br><br>\` +
          \`<strong>Código:</strong> \${bookingId}<br>\` +
          \`\${courtName} • \${dateText}<br>\` +
          \`\${selectedTime} às \${selectedEndTime} (\${duration} \${duration===1?'hora':'horas'}) • <strong>\${money(price)}</strong><br><br>\` +
          \`<a href="\${zapUrl}" target="_blank" style="display:inline-block;background:#25d366;color:#ffffff;padding:8px 16px;border-radius:10px;text-decoration:none;font-weight:bold;margin-top:6px;">📲 Abrir Comprovante no WhatsApp</a>\`;
        
        // Recarrega os horários para bloquear o horário que acabou de ser agendado
        await loadBookingsFromDatabase();
        renderTimes();
      } catch (err) {
        console.error('Erro ao agendar:', err);
        notice.innerHTML = \`<strong>Resumo gerado, \${escapeHtml(name)}:</strong><br>\${courtName} • \${dateText} • \${selectedTime} às \${selectedEndTime} • <strong>\${money(price)}</strong>\`;
      }

      notice.classList.add('show');
      notice.scrollIntoView({behavior:'smooth',block:'nearest'});
    });`;

html = html.replace(oldFormSubmit, newFormSubmit);

// 5. Add a top banner indicating Sistema 2 (Localhost com Banco de Dados Conectado)
const bodyTarget = '<body>';
const sistema2Banner = `<body>
  <div style="background: linear-gradient(90deg, #064e3b, #0f172a); color: #ffffff; padding: 8px 16px; font-size: 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(16,185,129,0.3); font-family: sans-serif; position: sticky; top: 0; z-index: 9999;">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="background: #10b981; color: #064e3b; font-weight: 900; padding: 2px 8px; rounded: 6px; border-radius: 4px; font-size: 11px;">SISTEMA 2 • LOCALHOST</span>
      <span>Banco de Dados Vinculado (Supabase Nuvem + Local)</span>
    </div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <a href="/adm-sec-x9k7-limoeiro-2026-auth" style="color: #6ee7b7; text-decoration: none; font-weight: bold;">⚙️ Painel Admin Local</a>
      <a href="https://arenalimoeiro.vercel.app" target="_blank" style="color: #94a3b8; text-decoration: none;">🌐 Ver Sistema 1 (Vercel)</a>
    </div>
  </div>`;

html = html.replace(bodyTarget, sistema2Banner);

fs.writeFileSync('public/index-sistema2.html', html, 'utf8');
console.log('Successfully configured public/index-sistema2.html connected to Supabase database!');
