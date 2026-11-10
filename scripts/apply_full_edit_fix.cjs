const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

console.log('Original content size:', content.length);

// =========================================================================
// CORREÇÃO 1: Eliminar o auto-ban/auto-exclusão do cliente ao clicar em Salvar
// Linha ~10124 em handleSalvarClienteModal
// =========================================================================
const targetExclBug = `      try {
        let exclCust = {};
        const s = localStorage.getItem('arena_clientes_excluidos_v1');
        if (s) exclCust = JSON.parse(s);
        exclCust[keyName] = { name: nome, at: new Date().toISOString() };
        localStorage.setItem('arena_clientes_excluidos_v1', JSON.stringify(exclCust));
      } catch(e) {}`;

// Se o usuário está salvando/editando o cliente, ele NUNCA deve ser adicionado à lista de excluídos!
// Pelo contrário: se ele estivesse na lista de excluídos por engano, deve ser removido dela.
const replaceExclBug = `      try {
        // Garante que o cliente salvo NUNCA fique na lista de excluídos locais
        const s = localStorage.getItem('arena_clientes_excluidos_v1');
        if (s) {
          const exclCust = JSON.parse(s);
          const kName = (nome || '').trim().toLowerCase();
          if (exclCust[kName]) {
            delete exclCust[kName];
            localStorage.setItem('arena_clientes_excluidos_v1', JSON.stringify(exclCust));
          }
        }
      } catch(e) {}`;

if (content.includes(targetExclBug)) {
  content = content.replace(targetExclBug, replaceExclBug);
  console.log('[OK] Correção 1 aplicada: Removido bug de auto-exclusão ao salvar cliente');
} else {
  console.warn('[AVISO] targetExclBug não encontrado exatamente');
}

// =========================================================================
// CORREÇÃO 2: Salvar o campo da quadra selecionada diretamente em monthly_members
// No modal de Gerenciar Cliente (handleSalvarClienteModal)
// =========================================================================
// Vamos adicionar o campo <select id="modalGerenciarQuadra"> no modalGerenciarCliente
const targetModalCampos = `          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-purple-950 mb-1">Horário & Quadra Fixa</label>
            <input type="text" id="modalGerenciarHorarioFixo" placeholder="Ex.: Campo Society 01 - 20:00 às 22:00"
                   class="w-full px-3 py-2 text-xs font-bold bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none">
          </div>`;

const replaceModalCampos = `          <div>
            <label class="block text-xs font-semibold text-purple-950 mb-1">Quadra / Espaço Fixo *</label>
            <select id="modalGerenciarQuadra"
                    class="w-full px-3 py-2 text-xs font-bold bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer">
              <option value="fut5">FUT 5 – SOCCER 5</option>
              <option value="fut6">FUT 6 – SOCCER 6</option>
              <option value="fut7">FUT 7 – SOCCER 7</option>
              <option value="futmesa">FOOT TABLE – FUTMESA</option>
              <option value="areia">AREIA – BEACH SPORTS</option>
              <option value="society">SOCIETY – ARENA CENTRAL</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-purple-950 mb-1">Horário de Início Fixo</label>
            <input type="time" id="modalGerenciarHorarioInicio" value="20:00"
                   class="w-full px-3 py-2 text-xs font-bold bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none">
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-purple-950 mb-1">Descrição / Observação do Horário</label>
            <input type="text" id="modalGerenciarHorarioFixo" placeholder="Ex.: FUT 6 - 20:00 às 21:30"
                   class="w-full px-3 py-2 text-xs font-bold bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none">
          </div>`;

if (content.includes(targetModalCampos)) {
  content = content.replace(targetModalCampos, replaceModalCampos);
  console.log('[OK] Correção 2 aplicada: Campo de quadra e horário estruturado inserido no modal de cliente');
} else {
  console.warn('[AVISO] targetModalCampos não encontrado');
}

// =========================================================================
// CORREÇÃO 3: Mapeamento de quadras no banco (monthly_members e bookings)
// =========================================================================
// Preenchimento do modalGerenciarCliente ao abrir (abrirModalGerenciarCliente)
const targetAbrirModal = `    document.getElementById('modalGerenciarValorMensal').value = cliente.monthlyPrice || '280.00';
    document.getElementById('modalGerenciarDiaSemana').value = cliente.monthlyDay || 'segunda';
    document.getElementById('modalGerenciarHorarioFixo').value = cliente.horarioFixo || '';`;

const replaceAbrirModal = `    document.getElementById('modalGerenciarValorMensal').value = cliente.monthlyPrice || '280.00';
    document.getElementById('modalGerenciarDiaSemana').value = cliente.monthlyDay || 'segunda';
    document.getElementById('modalGerenciarHorarioFixo').value = cliente.horarioFixo || '';
    const qSelect = document.getElementById('modalGerenciarQuadra');
    if (qSelect) {
      const qVal = cliente.courtId || cliente.court_id || 'fut6';
      const resolvedCourt = getCourtById(qVal);
      qSelect.value = resolvedCourt.id;
    }
    const hInput = document.getElementById('modalGerenciarHorarioInicio');
    if (hInput) {
      hInput.value = cliente.startTime || cliente.start_time || '20:00';
    }`;

if (content.includes(targetAbrirModal)) {
  content = content.replace(targetAbrirModal, replaceAbrirModal);
  console.log('[OK] Correção 3 aplicada: abrirModalGerenciarCliente popula a quadra e o horário');
} else {
  console.warn('[AVISO] targetAbrirModal não encontrado');
}

// Inclusão de courtId no clientMap
const targetClientMap1 = `          horarioFixo: (m.day_of_week_label || ('Toda ' + (m.day_of_week || 'semana'))) + ' - ' + (m.start_time || m.time || '18:00') + ' às ' + (m.end_time || '20:00'),
          monthlyId: m.id,
          origem: 'monthly'`;

const replaceClientMap1 = `          horarioFixo: (m.day_of_week_label || ('Toda ' + (m.day_of_week || 'semana'))) + ' - ' + (m.start_time || m.time || '18:00') + ' às ' + (m.end_time || '20:00'),
          monthlyId: m.id,
          courtId: getCourtById(m.court_id || m.courtId).id,
          startTime: m.start_time || m.time || '18:00',
          origem: 'monthly'`;

if (content.includes(targetClientMap1)) {
  content = content.replace(targetClientMap1, replaceClientMap1);
  console.log('[OK] Correção 4 aplicada: clientMap inclui courtId e startTime');
} else {
  console.warn('[AVISO] targetClientMap1 não encontrado');
}

// Atualização de monthlyPayload em handleSalvarClienteModal
const targetSyncMonthly = `      // 2. Se for Mensalista, sincronizar contrato em \`monthly_members\`
      const syncMonthlyToDb = async (dbUrl, dbKey) => {
        if (categoria === 'Mensalista') {
          const mId = monthlyId || ('mensal-' + Date.now());
          const monthlyPayload = {
            id: mId,
            customer_id: id,
            responsible_name: nome,
            team_name: nome,
            phone: telefone,
            monthly_price: valorMensal,
            day_of_week: diaSemana,
            day_of_week_label: 'Toda ' + diaSemana + '-feira',
            status: 'active',
            observation: horarioFixo ? ('[Horário: ' + horarioFixo + '] | [CPF: ' + cpf + ']') : ('[CPF: ' + cpf + ']')
          };`;

const replaceSyncMonthly = `      // 2. Se for Mensalista, sincronizar contrato em \`monthly_members\`
      const selQuadraEl = document.getElementById('modalGerenciarQuadra');
      const quadraId = selQuadraEl ? selQuadraEl.value : 'fut6';
      const resolvedCourtObj = getCourtById(quadraId);

      const dbCourtMapping = {
        'fut5': 'court-society-1',
        'fut6': 'court-society-2',
        'fut7': 'court-beach-1',
        'futmesa': 'court-esportes-de-quadra-1788962671043',
        'areia': 'court-beach-2',
        'society': 'court-futsal-1788963178368'
      };
      const finalDbCourtId = dbCourtMapping[resolvedCourtObj.id] || resolvedCourtObj.id;

      const horarioInicioEl = document.getElementById('modalGerenciarHorarioInicio');
      const startT = horarioInicioEl ? horarioInicioEl.value : '20:00';
      const [sh, sm] = startT.split(':').map(Number);
      const endT = String(sh + 1).padStart(2, '0') + ':' + String(sm).padStart(2, '0');

      const syncMonthlyToDb = async (dbUrl, dbKey) => {
        if (categoria === 'Mensalista') {
          const mId = monthlyId || ('mensal-' + Date.now());
          const monthlyPayload = {
            id: mId,
            customer_id: id,
            responsible_name: nome,
            team_name: nome,
            phone: telefone,
            court_id: finalDbCourtId,
            time: startT,
            start_time: startT,
            end_time: endT,
            monthly_price: valorMensal,
            day_of_week: diaSemana,
            day_of_week_label: 'Toda ' + diaSemana + '-feira',
            status: 'active',
            observation: horarioFixo ? ('[Horário: ' + horarioFixo + '] | [CPF: ' + cpf + ']') : ('[CPF: ' + cpf + ']')
          };`;

if (content.includes(targetSyncMonthly)) {
  content = content.replace(targetSyncMonthly, replaceSyncMonthly);
  console.log('[OK] Correção 5 aplicada: syncMonthlyToDb grava court_id, start_time e end_time no banco');
} else {
  console.warn('[AVISO] targetSyncMonthly não encontrado');
}

// Sincronizar também no estado local monthlyMembers em handleSalvarClienteModal
const targetLocalUpdate = `      // Atualiza estado local em memória
      const existingCust = (window.adminGameState.customers || []).find(c => c.id === id);
      if (existingCust) {
        existingCust.name = nome;
        existingCust.phone = telefone;
        existingCust.document = cpf;
      } else {
        window.adminGameState.customers.push(customerPayload);
      }`;

const replaceLocalUpdate = `      // Atualiza estado local em memória
      const existingCust = (window.adminGameState.customers || []).find(c => c.id === id);
      if (existingCust) {
        existingCust.name = nome;
        existingCust.phone = telefone;
        existingCust.document = cpf;
      } else {
        window.adminGameState.customers.push(customerPayload);
      }

      if (categoria === 'Mensalista') {
        const mId = monthlyId || ('mensal-' + Date.now());
        const exMember = (window.adminGameState.monthlyMembers || []).find(m => String(m.id) === String(mId) || (m.responsible_name && m.responsible_name.toLowerCase() === nome.toLowerCase()));
        if (exMember) {
          exMember.responsible_name = nome;
          exMember.team_name = nome;
          exMember.phone = telefone;
          exMember.court_id = finalDbCourtId;
          exMember.day_of_week = diaSemana;
          exMember.start_time = startT;
          exMember.time = startT;
          exMember.end_time = endT;
          exMember.monthly_price = valorMensal;
        } else {
          window.adminGameState.monthlyMembers.push({
            id: mId,
            customer_id: id,
            responsible_name: nome,
            team_name: nome,
            phone: telefone,
            court_id: finalDbCourtId,
            day_of_week: diaSemana,
            start_time: startT,
            time: startT,
            end_time: endT,
            monthly_price: valorMensal,
            status: 'active'
          });
        }
      }`;

if (content.includes(targetLocalUpdate)) {
  content = content.replace(targetLocalUpdate, replaceLocalUpdate);
  console.log('[OK] Correção 6 aplicada: Atualização imediata em memória de monthlyMembers');
} else {
  console.warn('[AVISO] targetLocalUpdate não encontrado');
}

// =========================================================================
// CORREÇÃO 7: Salvar Edição de Jogo (saveEditGame) para Mensalistas
// Se for um mensalista (id começa com monthly- ou isMensalista), atualizar
// também a tabela monthly_members (court_id, start_time, end_time, etc.)
// =========================================================================
const targetSaveEditGameEnd = `    saveAdminGameState();
    // ☁️ Envia a edição imediatamente para os Bancos de Dados na Nuvem (Dual-Write)
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
    }
    closeArenaModal('arenaEditModal');
    renderMovementMatches();
    renderCadastrosBookingsList();
    arenaToast('Partida atualizada com sucesso!');`;

const replaceSaveEditGameEnd = `    // Se o jogo editado for um Mensalista Fixo, sincroniza também em monthly_members
    if (String(id).startsWith('monthly-') || g.isMensalista || g.booking_type === 'mensalista') {
      const rawMonthlyId = String(id).replace('monthly-', '');
      const exM = (window.adminGameState.monthlyMembers || []).find(m => String(m.id) === rawMonthlyId || (m.responsible_name && m.responsible_name.toLowerCase() === g.customer_name.toLowerCase()));
      
      const dbCourtMapping = {
        'fut5': 'court-society-1',
        'fut6': 'court-society-2',
        'fut7': 'court-beach-1',
        'futmesa': 'court-esportes-de-quadra-1788962671043',
        'areia': 'court-beach-2',
        'society': 'court-futsal-1788963178368'
      };
      const finalDbCourtId = dbCourtMapping[court.id] || court.id;

      if (exM) {
        exM.court_id = finalDbCourtId;
        exM.start_time = newStart;
        exM.time = newStart;
        exM.end_time = newEnd;
        if (g.customer_phone) exM.phone = g.customer_phone;
      }

      // Persiste sem travar nos 2 bancos Supabase (DB2 e DB1)
      if (typeof ARENA_CLOUD_DBS !== 'undefined') {
        const patchPayload = {
          court_id: finalDbCourtId,
          start_time: newStart,
          time: newStart,
          end_time: newEnd,
          phone: g.customer_phone || ''
        };
        [ARENA_CLOUD_DBS.db2Url, ARENA_CLOUD_DBS.db1Url].forEach((dbUrl, idx) => {
          if (!dbUrl) return;
          const key = idx === 0 ? ARENA_CLOUD_DBS.db2Key : ARENA_CLOUD_DBS.db1Key;
          fetch(dbUrl + '/rest/v1/monthly_members?id=eq.' + encodeURIComponent(rawMonthlyId), {
            method: 'PATCH',
            headers: {
              'apikey': key,
              'Authorization': 'Bearer ' + key,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(patchPayload)
          }).catch(() => {});
        });
      }
    }

    saveAdminGameState();
    // ☁️ Envia a edição imediatamente para os Bancos de Dados na Nuvem (Dual-Write)
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
    }
    closeArenaModal('arenaEditModal');
    renderMovementMatches();
    renderCadastrosBookingsList();
    if (typeof renderCadastrosClientes === 'function') renderCadastrosClientes();
    arenaToast('Partida atualizada com sucesso!');`;

if (content.includes(targetSaveEditGameEnd)) {
  content = content.replace(targetSaveEditGameEnd, replaceSaveEditGameEnd);
  console.log('[OK] Correção 7 aplicada: saveEditGame atualiza monthly_members e recarrega clientes');
} else {
  console.warn('[AVISO] targetSaveEditGameEnd não encontrado');
}

// =========================================================================
// CORREÇÃO 8: Corrigir erro no saveContract onde tentava enviar updated_at e court_name
// que causavam erro 400 no Supabase
// =========================================================================
const targetSaveContractBadFields = `            body: JSON.stringify({
                court_id: dbCourtId,
                court_name: selectedCourt.name,
                updated_at: new Date().toISOString()
              })`;

const replaceSaveContractBadFields = `            body: JSON.stringify({
                court_id: dbCourtId
              })`;

if (content.includes(targetSaveContractBadFields)) {
  content = content.replace(targetSaveContractBadFields, replaceSaveContractBadFields);
  console.log('[OK] Correção 8 aplicada: Removidos campos inexistentes court_name e updated_at do PATCH de monthly_members');
} else {
  console.warn('[AVISO] targetSaveContractBadFields não encontrado');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Finalizado com sucesso! Novo tamanho de admin.html:', content.length);
