const fs = require('fs');
const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let html = fs.readFileSync(path, 'utf8');

const targetFunction = `    window.switchCourtsSubTab = function(sub) {
      const btnQuadras = document.getElementById('btnCourtsSub-quadras');
      const btnModalidades = document.getElementById('btnCourtsSub-modalidades');
      const contentQuadras = document.getElementById('courtsSubtab-quadras');
      const contentModalidades = document.getElementById('courtsSubtab-modalidades');

      if (sub === 'modalidades') {
        if (btnModalidades) {
          btnModalidades.className = 'tab-btn tab-active !flex-initial';
          const icon = btnModalidades.querySelector('i');
          if (icon) icon.className = 'w-4 h-4 shrink-0 text-white';
        }
        if (btnQuadras) {
          btnQuadras.className = 'tab-btn tab-inactive !flex-initial';
          const icon = btnQuadras.querySelector('i');
          if (icon) icon.className = 'w-4 h-4 shrink-0 text-slate-700';
        }
        if (contentQuadras) contentQuadras.classList.add('hidden');
        if (contentModalidades) {
          contentModalidades.classList.remove('hidden');
          if (typeof renderSpacesGrid === 'function') renderSpacesGrid();
        }
      } else {
        if (btnQuadras) {
          btnQuadras.className = 'tab-btn tab-active !flex-initial';
          const icon = btnQuadras.querySelector('i');
          if (icon) icon.className = 'w-4 h-4 shrink-0 text-white';
        }
        if (btnModalidades) {
          btnModalidades.className = 'tab-btn tab-inactive !flex-initial';
          const icon = btnModalidades.querySelector('i');
          if (icon) icon.className = 'w-4 h-4 shrink-0 text-slate-700';
        }
        if (contentModalidades) contentModalidades.classList.add('hidden');
        if (contentQuadras) {
          contentQuadras.classList.remove('hidden');
          if (typeof renderCourtsMonitor === 'function') renderCourtsMonitor();
        }
      }
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    };`;

const newSubTabFunction = `    window.switchCourtsSubTab = function(sub) {
      const subTabs = ['quadras', 'modalidades', 'posicoes', 'mensalistas', 'jogos'];
      
      subTabs.forEach(t => {
        const btn = document.getElementById('btnCourtsSub-' + t);
        const panel = document.getElementById('courtsSubtab-' + t);
        
        if (t === sub) {
          if (btn) {
            btn.className = 'tab-btn tab-active !flex-initial shrink-0';
            const icon = btn.querySelector('i');
            if (icon) icon.className = 'w-4 h-4 shrink-0 text-white';
          }
          if (panel) panel.classList.remove('hidden');
        } else {
          if (btn) {
            btn.className = 'tab-btn tab-inactive !flex-initial shrink-0';
            const icon = btn.querySelector('i');
            if (icon) icon.className = 'w-4 h-4 shrink-0 text-slate-700';
          }
          if (panel) panel.classList.add('hidden');
        }
      });

      // Atualiza badges numéricas
      const bCourts = document.getElementById('badgeCourtsCount');
      if (bCourts && window.courtState && window.courtState.courts) bCourts.textContent = window.courtState.courts.length;

      const bMensalistas = document.getElementById('badgeCourtsMensalistasCount');
      const members = (window.adminGameState && window.adminGameState.monthlyMembers) || [];
      if (bMensalistas) bMensalistas.textContent = members.length;

      const bJogos = document.getElementById('badgeCourtsJogosCount');
      const bJogosTotal = document.getElementById('courtsJogosTotalBadge');
      const bookingsCount = (window.adminGameState && window.adminGameState.bookings) ? window.adminGameState.bookings.length : 0;
      if (bJogos) bJogos.textContent = bookingsCount;
      if (bJogosTotal) bJogosTotal.textContent = bookingsCount + ' partidas registradas';

      // Executa lógica específica de cada sub-aba
      if (sub === 'quadras') {
        if (typeof renderCourtsMonitor === 'function') renderCourtsMonitor();
      } else if (sub === 'modalidades') {
        if (typeof renderSpacesGrid === 'function') renderSpacesGrid();
      } else if (sub === 'posicoes') {
        if (typeof renderCourtPositions === 'function') renderCourtPositions();
      } else if (sub === 'mensalistas') {
        if (typeof renderCourtsMensalistasTable === 'function') renderCourtsMensalistasTable();
      } else if (sub === 'jogos') {
        if (typeof renderCourtsBookingsTable === 'function') renderCourtsBookingsTable();
      }

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    };

    // Renderizador e Gerenciador da Sub-aba: Posições dos Jogos
    window.renderCourtPositions = function() {
      const container = document.getElementById('courtPositionsListContainer');
      const badge = document.getElementById('badgePositionsCount');
      if (!container) return;

      const courts = (window.courtState && window.courtState.courts && window.courtState.courts.length) 
        ? window.courtState.courts 
        : ((window.adminGameState && window.adminGameState.courts) ? window.adminGameState.courts : []);

      if (badge) badge.textContent = courts.length + ' quadras ativas';

      if (!courts.length) {
        container.innerHTML = '<div class="p-6 text-center text-xs text-slate-400">Nenhum espaço cadastrado.</div>';
        return;
      }

      container.innerHTML = courts.map((c, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === courts.length - 1;
        const statusLabel = c.status === 'operacional' ? 'Operacional' : (c.status === 'manutencao' ? 'Em Manutenção' : 'Pausada');
        const statusColor = c.status === 'operacional' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700';
        const price = c.price || c.rate || c.normal || 100;

        return \`
          <div class="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/70 transition shadow-2xs gap-3">
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                #\${idx + 1}
              </span>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="text-xs font-black text-slate-900">\${c.name}</h4>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold \${statusColor}">\${statusLabel}</span>
                </div>
                <div class="text-[11px] text-slate-500 font-medium">
                  \${c.type || c.categoryLabel || 'Quadra'} • R$ \${price}/hora
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button type="button" onclick="moveCourtPosition(\${idx}, -1)" \${isFirst ? 'disabled class=\"opacity-30 cursor-not-allowed\"' : 'class=\"hover:bg-slate-200 cursor-pointer\"'} class="p-2 rounded-xl bg-slate-100 text-slate-700 transition" title="Subir posição">
                <i data-lucide="chevron-up" class="w-4 h-4"></i>
              </button>
              <button type="button" onclick="moveCourtPosition(\${idx}, 1)" \${isLast ? 'disabled class=\"opacity-30 cursor-not-allowed\"' : 'class=\"hover:bg-slate-200 cursor-pointer\"'} class="p-2 rounded-xl bg-slate-100 text-slate-700 transition" title="Descer posição">
                <i data-lucide="chevron-down" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        \`;
      }).join('');

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    };

    window.moveCourtPosition = function(index, dir) {
      if (!window.courtState || !Array.isArray(window.courtState.courts)) return;
      const arr = window.courtState.courts;
      const target = index + dir;
      if (target < 0 || target >= arr.length) return;

      const temp = arr[index];
      arr[index] = arr[target];
      arr[target] = temp;

      // Se também existir em adminGameState.courts
      if (window.adminGameState && Array.isArray(window.adminGameState.courts)) {
        window.adminGameState.courts = [...arr];
      }

      renderCourtPositions();
      if (typeof saveCourtState === 'function') saveCourtState();
      if (typeof renderCourtsMonitor === 'function') renderCourtsMonitor();
    };

    window.saveCourtPositions = function() {
      if (typeof saveCourtState === 'function') saveCourtState();
      if (typeof mostrarToast === 'function') {
        mostrarToast('Posições e ordem dos jogos salvas com sucesso!');
      } else {
        alert('Posições e ordem dos jogos salvas com sucesso!');
      }
    };

    // Renderizador da Tabela de Horários Fixos (Mensalistas) dentro de Gestão de Espaços
    window.renderCourtsMensalistasTable = function() {
      const container = document.getElementById('courtsMensalistasTableContainer');
      const badge = document.getElementById('badgeCourtsTotalMensalistas');
      const badgeCount = document.getElementById('badgeCourtsMensalistasCount');
      const searchInput = document.getElementById('courtsMensalistasSearchInput');
      const dayFilter = document.getElementById('courtsMensalistasDayFilter');

      if (!container) return;

      const members = (window.adminGameState && window.adminGameState.monthlyMembers) ? window.adminGameState.monthlyMembers : [];
      if (badge) badge.textContent = members.length + ' mensalistas cadastrados';
      if (badgeCount) badgeCount.textContent = members.length;

      const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
      const dFilter = dayFilter ? dayFilter.value : 'all';

      let filtered = members.filter(m => {
        if (!m) return false;
        if (dFilter !== 'all') {
          const mDay = (m.day_of_week || m.dayOfWeek || '').toLowerCase();
          if (!mDay.includes(dFilter)) return false;
        }
        if (q) {
          const team = (m.team_name || m.teamName || '').toLowerCase();
          const resp = (m.responsible_name || m.responsibleName || '').toLowerCase();
          const phone = (m.phone || '').replace(/\\D/g, '');
          const court = (typeof getCourtById === 'function') ? getCourtById(m.court_id || m.courtId).name.toLowerCase() : '';
          return team.includes(q) || resp.includes(q) || phone.includes(q) || court.includes(q);
        }
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = \`
          <div class="p-8 text-center bg-slate-50 rounded-2xl">
            <i data-lucide="calendar-x" class="w-8 h-8 mx-auto text-slate-300 mb-2"></i>
            <p class="text-xs font-bold text-slate-500">Nenhum mensalista encontrado para os filtros selecionados.</p>
          </div>\`;
        if (window.lucide) lucide.createIcons();
        return;
      }

      let html = \`
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-100">
              <th class="p-3">Equipe / Responsável</th>
              <th class="p-3">Telefone</th>
              <th class="p-3">Quadra</th>
              <th class="p-3">Dia & Horário Fixo</th>
              <th class="p-3">Mensalidade</th>
              <th class="p-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-700">\`;

      filtered.forEach(m => {
        const court = (typeof getCourtById === 'function') ? getCourtById(m.court_id || m.courtId) : { name: 'Quadra' };
        const team = m.team_name || m.teamName || 'Mensalista';
        const resp = m.responsible_name || m.responsibleName || team;
        const phone = m.phone ? (typeof formatPhone === 'function' ? formatPhone(m.phone) : m.phone) : 'Não informado';
        const day = m.day_of_week_label || ('Toda ' + (m.day_of_week || 'semana'));
        const time = (m.start_time || m.time || '18:00') + ' às ' + (m.end_time || '20:00');
        const price = parseFloat(m.monthly_price || m.monthlyPrice || 0);
        const priceStr = price > 0 ? ('R$ ' + price.toFixed(2).replace('.', ',')) : 'R$ 0,00';

        html += \`
          <tr class="hover:bg-slate-50/60 transition">
            <td class="p-3 font-bold text-slate-900">
              <div>\${team}</div>
              <div class="text-[10px] text-slate-400 font-normal">\${resp}</div>
            </td>
            <td class="p-3 text-slate-600 font-mono">\${phone}</td>
            <td class="p-3">
              <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px]">\${court.name}</span>
            </td>
            <td class="p-3 font-semibold">
              <div>\${day}</div>
              <div class="text-[10px] text-slate-400">\${time}</div>
            </td>
            <td class="p-3 font-black text-emerald-700">\${priceStr}</td>
            <td class="p-3">
              <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800">Ativo</span>
            </td>
          </tr>\`;
      });

      html += '</tbody></table>';
      container.innerHTML = html;
      if (window.lucide) lucide.createIcons();
    };

    // Renderizador da Tabela de Jogos dentro de Gestão de Espaços
    window.renderCourtsBookingsTable = function() {
      const container = document.getElementById('courtsBookingsListContainer');
      const badge = document.getElementById('courtsJogosTotalBadge');
      const badgeNav = document.getElementById('badgeCourtsJogosCount');
      const searchInput = document.getElementById('courtsBookingSearchInput');
      const courtFilter = document.getElementById('courtsBookingCourtFilter');
      const statusFilter = document.getElementById('courtsBookingStatusFilter');

      if (!container) return;

      const bookings = (window.adminGameState && Array.isArray(window.adminGameState.bookings)) ? window.adminGameState.bookings : [];
      if (badge) badge.textContent = bookings.length + ' partidas registradas';
      if (badgeNav) badgeNav.textContent = bookings.length;

      const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
      const cFilter = courtFilter ? courtFilter.value : 'all';
      const sFilter = statusFilter ? statusFilter.value : 'all';

      let filtered = bookings.filter(b => {
        if (!b) return false;
        if (cFilter !== 'all' && b.court_id !== cFilter && b.courtId !== cFilter) return false;
        if (sFilter !== 'all' && b.status !== sFilter) return false;
        if (q) {
          const client = (b.client_name || b.clientName || '').toLowerCase();
          const phone = (b.client_phone || b.clientPhone || '').replace(/\\D/g, '');
          const court = (typeof getCourtById === 'function') ? getCourtById(b.court_id || b.courtId).name.toLowerCase() : '';
          return client.includes(q) || phone.includes(q) || court.includes(q);
        }
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = \`
          <div class="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <i data-lucide="calendar-x" class="w-8 h-8 mx-auto text-slate-300 mb-2"></i>
            <p class="text-xs font-bold text-slate-600">Nenhum agendamento encontrado.</p>
            <p class="text-[11px] text-slate-400 mt-1">Todas as novas partidas agendadas no sistema aparecerão aqui automaticamente.</p>
          </div>\`;
        if (window.lucide) lucide.createIcons();
        return;
      }

      container.innerHTML = filtered.map(b => {
        const court = (typeof getCourtById === 'function') ? getCourtById(b.court_id || b.courtId) : { name: 'Quadra' };
        const client = b.client_name || b.clientName || 'Cliente';
        const date = b.date || '';
        const time = (b.start_time || b.startTime || '18:00') + ' às ' + (b.end_time || b.endTime || '19:00');
        const price = parseFloat(b.price || b.total_price || 0);

        return \`
          <div class="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition shadow-2xs">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center shrink-0">⚽</div>
              <div>
                <h4 class="text-xs font-black text-slate-900">\${client}</h4>
                <div class="text-[11px] text-slate-500 font-medium">
                  <span class="font-bold text-emerald-800">\${court.name}</span> • \${date} (\${time})
                </div>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs font-black text-emerald-700 block">R$ \${price.toFixed(2).replace('.', ',')}</span>
              <span class="px-2 py-0.5 rounded-md text-[9px] font-black bg-blue-50 text-blue-700 uppercase">\${b.status || 'Confirmado'}</span>
            </div>
          </div>
        \`;
      }).join('');

      if (window.lucide) lucide.createIcons();
    };`;

if (!html.includes(targetFunction)) {
  console.error('Could not find targetFunction in admin.html!');
  process.exit(1);
}

html = html.replace(targetFunction, newSubTabFunction);
fs.writeFileSync(path, html, 'utf8');
console.log('Successfully updated JavaScript in admin.html!');
