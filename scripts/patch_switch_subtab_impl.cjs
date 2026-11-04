const fs = require('fs');

const path = 'public/admin.html';
let content = fs.readFileSync(path, 'utf8');

const idxStart = content.indexOf('window.switchCadastrosSubTab = function(subtabName) {');
const idxEnd = content.indexOf('function renderCadastrosBookingsList() {');

if (idxStart !== -1 && idxEnd !== -1) {
  const replacement = `window.switchCadastrosSubTab = function(subtabName) {
    window.adminGameState.activeCadastrosSubTab = subtabName;

    const tabs = ['jogos', 'modalidades', 'mensalistas', 'clientes', 'supabase', 'backup'];
    tabs.forEach(t => {
      const btn = document.getElementById('btnSubtab-' + t);
      const contentEl = document.getElementById('subtab-content-' + t);
      if (t === subtabName) {
        if (btn) btn.className = 'px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer bg-slate-900 text-white shadow border border-slate-900 flex items-center gap-1.5';
        if (contentEl) contentEl.classList.remove('hidden');
      } else {
        if (btn) btn.className = 'px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs flex items-center gap-1.5';
        if (contentEl) contentEl.classList.add('hidden');
      }
    });

    if (subtabName === 'jogos') {
      renderCadastrosBookingsList();
      if (window.location.hash === "#openModal" || window.location.search.includes("modal=direct")) {
        openDirectBookingModal();
      }
    } else if (subtabName === 'mensalistas') {
      renderCadastrosMensalistas();
    } else if (subtabName === 'clientes') {
      renderCadastrosClientes();
    } else if (subtabName === 'supabase') {
      testSupabaseLatency();
    } else if (subtabName === 'backup') {
      if (typeof window.downloadCompleteBackup === 'function') window.downloadCompleteBackup();
    }
    if (window.lucide) lucide.createIcons();
  };

  window.renderCadastrosMensalistas = function() {
    const container = document.getElementById('mensalistasTableContainer');
    const badge = document.getElementById('badgeTotalMensalistasCount');
    const badgeCount = document.getElementById('subtabBadgeMensalistasCount');
    const searchInput = document.getElementById('mensalistasSearchInput');
    const dayFilter = document.getElementById('mensalistasDayFilter');

    if (!container) return;

    const members = window.adminGameState.monthlyMembers || [];
    if (badge) badge.textContent = members.length + ' mensalistas cadastrados';
    if (badgeCount) badgeCount.textContent = '(' + members.length + ')';

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
      const phone = m.phone ? formatPhone(m.phone) : 'Não informado';
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
          <td class="p-3 font-black text-slate-900">\${priceStr}</td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black inline-flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo
            </span>
          </td>
        </tr>\`;
    });

    html += \`</tbody></table>\`;
    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  };

  window.renderCadastrosClientes = function() {
    const container = document.getElementById('clientesTableContainer');
    const badge = document.getElementById('badgeTotalClientesCount');
    const searchInput = document.getElementById('clientesSearchInput');
    if (!container) return;

    const clientMap = new Map();
    (window.adminGameState.bookings || []).forEach(b => {
      const name = b.customer_name || b.customerName;
      if (name && !clientMap.has(name)) {
        clientMap.set(name, {
          name: name,
          phone: b.customer_phone || b.customerPhone || '',
          cpf: b.customer_cpf || b.customerCpf || '',
          type: b.booking_type === 'mensalista' ? 'Mensalista' : 'Avulso',
          count: 1
        });
      } else if (name) {
        clientMap.get(name).count++;
      }
    });

    (window.adminGameState.monthlyMembers || []).forEach(m => {
      const name = m.responsible_name || m.team_name;
      if (name && !clientMap.has(name)) {
        clientMap.set(name, {
          name: name,
          phone: m.phone || '',
          cpf: m.cpf || '',
          type: 'Mensalista',
          count: 4
        });
      }
    });

    const clients = Array.from(clientMap.values());
    if (badge) badge.textContent = clients.length + ' clientes cadastrados';

    const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const filtered = clients.filter(c => {
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.phone.replace(/\\D/g, '').includes(q) || c.cpf.replace(/\\D/g, '').includes(q);
    });

    if (filtered.length === 0) {
      container.innerHTML = \`
        <div class="p-8 text-center bg-slate-50 rounded-2xl">
          <p class="text-xs font-bold text-slate-500">Nenhum cliente encontrado.</p>
        </div>\`;
      return;
    }

    let html = \`
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="bg-slate-50 text-slate-500 font-black uppercase text-[10px] border-b border-slate-100">
            <th class="p-3">Nome do Cliente</th>
            <th class="p-3">Telefone / WhatsApp</th>
            <th class="p-3">CPF</th>
            <th class="p-3">Categoria</th>
            <th class="p-3">Partidas</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">\`;

    filtered.forEach(c => {
      const phoneClean = (c.phone || '').replace(/\\D/g, '');
      const waLink = phoneClean ? ('https://wa.me/55' + phoneClean) : '#';
      html += \`
        <tr class="hover:bg-slate-50/60 transition">
          <td class="p-3 font-bold text-slate-900">\${c.name}</td>
          <td class="p-3 font-mono">
            \${c.phone ? formatPhone(c.phone) : 'Sem telefone'}
            \${phoneClean ? ('<a href="' + waLink + '" target="_blank" class="ml-2 text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-0.5">💬 WhatsApp</a>') : ''}
          </td>
          <td class="p-3 text-slate-500 font-mono">\${c.cpf ? formatCPF(c.cpf) : 'Não informado'}</td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded-md \${c.type === 'Mensalista' ? 'bg-purple-50 text-purple-800' : 'bg-slate-100 text-slate-700'} font-bold text-[10px]">\${c.type}</span>
          </td>
          <td class="p-3 font-bold text-slate-900">\${c.count} partidas</td>
        </tr>\`;
    });

    html += \`</tbody></table>\`;
    container.innerHTML = html;
  };

  window.testSupabaseLatency = async function() {
    const lat2El = document.getElementById('db2PingLatency');
    const lat1El = document.getElementById('db1PingLatency');
    if (lat2El) lat2El.textContent = 'Testando...';
    if (lat1El) lat1El.textContent = 'Testando...';

    const t0 = performance.now();
    try {
      const r2 = await fetch(ARENA_CLOUD_DBS.db2Url + '/rest/v1/bookings?select=id&limit=1', {
        headers: { apikey: ARENA_CLOUD_DBS.db2Key, Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db2Key }
      });
      const t1 = performance.now();
      if (lat2El) lat2El.textContent = Math.round(t1 - t0) + 'ms (OK)';
    } catch(e) {
      if (lat2El) lat2El.textContent = 'Erro';
    }

    const t2 = performance.now();
    try {
      const r1 = await fetch(ARENA_CLOUD_DBS.db1Url + '/rest/v1/bookings?select=id&limit=1', {
        headers: { apikey: ARENA_CLOUD_DBS.db1Key, Authorization: 'Bearer ' + ARENA_CLOUD_DBS.db1Key }
      });
      const t3 = performance.now();
      if (lat1El) lat1El.textContent = Math.round(t3 - t2) + 'ms (OK)';
    } catch(e) {
      if (lat1El) lat1El.textContent = 'Erro';
    }
  };

  `;

  content = content.substring(0, idxStart) + replacement + content.substring(idxEnd);
  fs.writeFileSync(path, content, 'utf8');
  console.log('✓ Successfully injected enhanced switchCadastrosSubTab and all subtab renderers');
} else {
  console.error('Indices not found!');
}
