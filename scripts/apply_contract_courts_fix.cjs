const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../public/admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

console.log('Original length:', content.length);

// 1. Atualizar getCourtById
const oldGetCourt = `  // Mapeamento preciso de quadras por ID do banco de dados
  function getCourtById(cId) {
    if (!cId) return ADMIN_COURTS[0];
    const clean = String(cId).toLowerCase();
    if (clean === 'court-esportes-de-quadra-1788962671043' || clean.includes('fut5')) return ADMIN_COURTS[0];
    if (clean === 'court-society-2' || clean.includes('fut6')) return ADMIN_COURTS[1];
    if (clean === 'court-futsal-1788963178368' || clean.includes('fut7')) return ADMIN_COURTS[2];
    if (clean.includes('futmesa') || clean.includes('foot-table')) return ADMIN_COURTS[3];
    if (clean === 'court-beach-1' || clean === 'court-beach-2' || clean.includes('areia') || clean.includes('beach')) return ADMIN_COURTS[4];
    if (clean === 'court-society-1' || clean.includes('society')) return ADMIN_COURTS[5];
    return ADMIN_COURTS.find(c => c.id === cId) || ADMIN_COURTS[0];
  }`;

const newGetCourt = `  // Mapeamento preciso e oficial de quadras e campos da Arena Limoeiro
  function getCourtById(cId) {
    if (!cId) return ADMIN_COURTS[0];
    const clean = String(cId).toLowerCase();
    // 1. FUT 5 (court-society-1)
    if (clean === 'court-society-1' || clean === 'fut5' || clean.includes('fut 5') || clean.includes('fut5') || clean.includes('soccer 5') || clean.includes('soccer-5')) return ADMIN_COURTS[0];
    // 2. FUT 6 (court-society-2)
    if (clean === 'court-society-2' || clean === 'fut6' || clean.includes('fut 6') || clean.includes('fut6') || clean.includes('soccer 6') || clean.includes('soccer-6')) return ADMIN_COURTS[1];
    // 3. FUT 7 (court-beach-1 - Campo Society Fut 7)
    if (clean === 'court-beach-1' || clean === 'fut7' || clean.includes('fut 7') || clean.includes('fut7') || clean.includes('soccer 7') || clean.includes('soccer-7')) return ADMIN_COURTS[2];
    // 4. FUTMESA (court-esportes-de-quadra-1788962671043)
    if (clean === 'court-esportes-de-quadra-1788962671043' || clean === 'futmesa' || clean.includes('futmesa') || clean.includes('foot-table') || clean.includes('foottable') || clean.includes('esportes-de-quadra')) return ADMIN_COURTS[3];
    // 5. AREIA (court-beach-2 - Quadra de Areia)
    if (clean === 'court-beach-2' || clean === 'areia' || clean.includes('areia') || clean.includes('sand court') || clean.includes('beach-2')) return ADMIN_COURTS[4];
    // 6. QUADRA SOCIETY (court-futsal-1788963178368 - Arena Central)
    if (clean === 'court-futsal-1788963178368' || clean === 'society' || clean.includes('futsal') || clean.includes('quadra society') || clean.includes('arena central')) return ADMIN_COURTS[5];
    return ADMIN_COURTS.find(c => c.id === cId) || ADMIN_COURTS[0];
  }`;

if (!content.includes(oldGetCourt)) {
  console.error('ERROR: oldGetCourt not found!');
  process.exit(1);
}
content = content.replace(oldGetCourt, newGetCourt);
console.log('✓ getCourtById updated successfully.');

// 2. Remover bloco duplicado legado de contratos/jogos
const legacyStart = '  // Contrato\n  window.openContract = function(id) {\n    const g = getGame(id);';
const legacyEnd = 'arenaToast(\'Partida atualizada com sucesso!\');\n  };';

const posStart = content.indexOf(legacyStart);
const posEnd = content.indexOf(legacyEnd, posStart);

if (posStart === -1 || posEnd === -1) {
  console.error('ERROR: legacy block boundaries not found!', { posStart, posEnd });
  process.exit(1);
}

const legacyBlock = content.slice(posStart, posEnd + legacyEnd.length);
console.log('Legacy block found, length:', legacyBlock.length);
content = content.slice(0, posStart) + content.slice(posEnd + legacyEnd.length);
console.log('✓ Legacy duplicated block removed.');

// 3. Adicionar seletor de Quadra/Campo no modal arenaContractModal
const contractModalOldField = `        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Vínculo</label>
          <select id="contractType"
                  class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer">
            <option value="Mensalista">Mensalista Oficial</option>
            <option value="Avulso">Reserva Avulsa</option>
            <option value="Cortesia">Cortesia / Parceria</option>
          </select>
        </div>`;

const contractModalNewField = `        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Vínculo</label>
          <select id="contractType"
                  class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer">
            <option value="Mensalista">Mensalista Oficial</option>
            <option value="Avulso">Reserva Avulsa</option>
            <option value="Cortesia">Cortesia / Parceria</option>
          </select>
        </div>
      </div>

      <!-- Quadra / Espaço Oficial do Contrato -->
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Quadra / Campo Oficial *</label>
        <select id="contractCourt" required
                class="w-full p-2.5 bg-emerald-50/60 border border-emerald-300 rounded-xl text-xs font-black text-emerald-950 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer">
          <option value="fut5">FUT 5 – SOCCER 5 (Quadra Society 1)</option>
          <option value="fut6">FUT 6 – SOCCER 6 (Quadra Society 2)</option>
          <option value="fut7">FUT 7 – SOCCER 7 (Campo Society Fut 7)</option>
          <option value="futmesa">FOOT TABLE – FUTMESA (Futmesa & Lazer)</option>
          <option value="areia">AREIA – BEACH SPORTS (Quadra de Areia)</option>
          <option value="society">QUADRA SOCIETY (Arena Central)</option>
        </select>`;

if (!content.includes(contractModalOldField)) {
  console.error('ERROR: contractModalOldField not found!');
  process.exit(1);
}
content = content.replace(contractModalOldField, contractModalNewField);
console.log('✓ Seletor de Quadra adicionado ao modal arenaContractModal.');

// 4. Atualizar openContract, saveContract e printContractTerm
const oldOpenContractBlock = `  // 2. Abrir Modal de Contrato
  window.openContract = function(id) {
    const g = getGame(id);
    if (!g) return;

    if (!g.contract) g.contract = {};
    document.getElementById('contractMatchId').value = id;
    document.getElementById('contractNumber').value = g.contract.number || 'AL-2026-' + (id.replace(/[^0-9]/g, '').slice(-3) || '042');
    document.getElementById('contractType').value = g.contract.type || g.type || 'Mensalista';
    document.getElementById('contractStart').value = g.contract.start || '2026-01-01';
    document.getElementById('contractEnd').value = g.contract.end || '2026-12-31';
    document.getElementById('contractDayFixed').value = g.contract.dayFixed || g.dayFixed || 'TERÇA';
    document.getElementById('contractDueDay').value = g.contract.dueDay || 10;
    document.getElementById('contractAmount').value = g.contract.amount || g.total_price || g.price || 400;
    document.getElementById('contractStatus').value = g.contract.status || 'Assinado / Vigente';
    document.getElementById('contractTerms').value = g.contract.terms || 'Reserva semanal fixa com tolerância de 10 minutos. Cancelamentos devem ser avisados com 48h de antecedência.';

    const modal = document.getElementById('arenaContractModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
    }
    if (window.lucide) lucide.createIcons();
  };

  // Salvar Contrato
  window.saveContract = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('contractMatchId').value;
    const g = getGame(id);
    if (!g) return;

    if (!g.contract) g.contract = {};
    g.contract.number = document.getElementById('contractNumber').value.trim();
    g.contract.type = document.getElementById('contractType').value;
    g.contract.start = document.getElementById('contractStart').value;
    g.contract.end = document.getElementById('contractEnd').value;
    g.contract.dayFixed = document.getElementById('contractDayFixed').value;
    g.contract.dueDay = parseInt(document.getElementById('contractDueDay').value || 10, 10);
    g.contract.amount = parseFloat(document.getElementById('contractAmount').value || 0);
    g.contract.status = document.getElementById('contractStatus').value;
    g.contract.terms = document.getElementById('contractTerms').value.trim();

    addMatchLog(g, 'Contrato atualizado', 'Termo ' + g.contract.number + ' salvo com vencimento dia ' + g.contract.dueDay);
    saveAdminGameState();
    closeArenaModal('arenaContractModal');
    renderMovementMatches();
    renderCadastrosBookingsList();
    arenaToast('Contrato do mensalista salvo com sucesso!');
  };`;

const newOpenContractBlock = `  // 2. Abrir Modal de Contrato
  window.openContract = function(id) {
    const g = getGame(id);
    if (!g) return;

    if (!g.contract) g.contract = {};
    document.getElementById('contractMatchId').value = id;
    document.getElementById('contractNumber').value = g.contract.number || 'AL-2026-' + (String(id).replace(/[^0-9]/g, '').slice(-3) || '042');
    document.getElementById('contractType').value = g.contract.type || g.type || 'Mensalista';

    // Determina e preenche com rigor a quadra/campo onde o fixo joga
    const court = getCourtById(g.court_id || g.courtId);
    const courtSelect = document.getElementById('contractCourt');
    if (courtSelect) {
      courtSelect.value = court.id;
    }

    document.getElementById('contractStart').value = g.contract.start || '2026-01-01';
    document.getElementById('contractEnd').value = g.contract.end || '2026-12-31';
    document.getElementById('contractDayFixed').value = g.contract.dayFixed || g.dayFixed || 'TERÇA';
    document.getElementById('contractDueDay').value = g.contract.dueDay || 10;
    document.getElementById('contractAmount').value = g.contract.amount || g.total_price || g.price || 400;
    document.getElementById('contractStatus').value = g.contract.status || 'Assinado / Vigente';
    document.getElementById('contractTerms').value = g.contract.terms || 'Reserva semanal fixa com tolerância de 10 minutos. Cancelamentos devem ser avisados com 48h de antecedência.';

    const modal = document.getElementById('arenaContractModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
    }
    if (window.lucide) lucide.createIcons();
  };

  // Salvar Contrato com sincronização de Quadra/Campo nos Bancos de Dados
  window.saveContract = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const id = document.getElementById('contractMatchId').value;
    const g = getGame(id);
    if (!g) return;

    if (!g.contract) g.contract = {};
    g.contract.number = document.getElementById('contractNumber').value.trim();
    g.contract.type = document.getElementById('contractType').value;
    g.contract.start = document.getElementById('contractStart').value;
    g.contract.end = document.getElementById('contractEnd').value;
    g.contract.dayFixed = document.getElementById('contractDayFixed').value;
    g.contract.dueDay = parseInt(document.getElementById('contractDueDay').value || 10, 10);
    g.contract.amount = parseFloat(document.getElementById('contractAmount').value || 0);
    g.contract.status = document.getElementById('contractStatus').value;
    g.contract.terms = document.getElementById('contractTerms').value.trim();

    // Sincroniza a Quadra/Campo selecionada no Contrato
    const courtSelect = document.getElementById('contractCourt');
    if (courtSelect && courtSelect.value) {
      const selectedCourt = getCourtById(courtSelect.value);
      g.court_id = selectedCourt.id;
      g.courtId = selectedCourt.id;
      g.court_name = selectedCourt.name;
      g.courtName = selectedCourt.name;
      g.space = selectedCourt.name;
      g.contract.courtId = selectedCourt.id;
      g.contract.courtName = selectedCourt.name;

      // Se for mensalista/fixo, atualiza no estado local e nos bancos Supabase
      if (String(id).startsWith('monthly-') || g.isMensalista) {
        const rawMonthlyId = String(id).replace('monthly-', '');
        const member = (window.adminGameState.monthlyMembers || []).find(m => String(m.id) === rawMonthlyId);
        if (member) {
          member.court_id = selectedCourt.id;
          member.courtId = selectedCourt.id;
          member.court_name = selectedCourt.name;
        }

        // Mapeamento para o ID do banco se aplicável
        const dbCourtMapping = {
          'fut5': 'court-society-1',
          'fut6': 'court-society-2',
          'fut7': 'court-beach-1',
          'futmesa': 'court-esportes-de-quadra-1788962671043',
          'areia': 'court-beach-2',
          'society': 'court-futsal-1788963178368'
        };
        const dbCourtId = dbCourtMapping[selectedCourt.id] || selectedCourt.id;

        // Persistência assíncrona imediata nos 2 bancos Supabase para monthly_members
        if (typeof ARENA_CLOUD_DBS !== 'undefined') {
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
              body: JSON.stringify({
                court_id: dbCourtId,
                court_name: selectedCourt.name,
                updated_at: new Date().toISOString()
              })
            }).catch(err => console.warn('[ArenaCloud] Erro sync court mensalista:', err));
          });
        }
      }
    }

    addMatchLog(g, 'Contrato atualizado', 'Termo ' + g.contract.number + ' · ' + (g.court_name || '') + ' · Venc: dia ' + g.contract.dueDay);
    saveAdminGameState();

    // ☁️ Persistência imediata no agendamento para nunca haver reversão
    if (typeof window.syncBookingToCloud === 'function') {
      window.syncBookingToCloud(g, 'upsert');
    }

    closeArenaModal('arenaContractModal');
    renderMovementMatches();
    renderCadastrosBookingsList();
    if (typeof renderCadastrosMonthlyList === 'function') renderCadastrosMonthlyList();
    arenaToast('Contrato e quadra do mensalista salvos com sucesso!');
  };`;

if (!content.includes(oldOpenContractBlock)) {
  console.error('ERROR: oldOpenContractBlock not found!');
  process.exit(1);
}
content = content.replace(oldOpenContractBlock, newOpenContractBlock);
console.log('✓ openContract e saveContract atualizados com sincronização de quadra.');

// 5. Garantir que printContractTerm use sempre court.name oficial do getCourtById
const oldPrintCourt = '<div class="box"><strong>Quadra / Espaço:</strong> ${g.courtName || g.space || \'---\'}</div>';
const newPrintCourt = `<div class="box"><strong>Quadra / Espaço:</strong> \${(function() { const ct = getCourtById(g.court_id || g.courtId); return ct ? ct.name : (g.courtName || g.space || '---'); })()}</div>`;

if (content.includes(oldPrintCourt)) {
  content = content.replace(oldPrintCourt, newPrintCourt);
  console.log('✓ printContractTerm atualizado para imprimir nome oficial da quadra.');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('✓ public/admin.html salvo com sucesso. Novo tamanho:', content.length);
