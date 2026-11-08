const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('[CloudSync] Starting migration: 100% Cloud Database (DB1 & DB2), zero localStorage...');

// 1. On page load, purge any stale prototype bookings from localStorage
const initPurgeCode = `  // 100% BANCO DE DADOS NA NUVEM: Limpa qualquer resquício de agendamentos locais antigos
  try {
    localStorage.removeItem('arena_local_bookings');
    localStorage.removeItem('arena-limoeiro-games-prototype-v2');
    localStorage.removeItem('arena_deleted_bookings');
    localStorage.removeItem('arena_monthly_members');
  } catch(e) {}`;

// Place the purge right at the beginning of the admin script
const adminScriptStart = `<script id="arena-main-script">\n(function() {`;
if (content.includes(adminScriptStart)) {
  content = content.replace(adminScriptStart, adminScriptStart + '\n' + initPurgeCode);
  console.log('[CloudSync] 1. Added localStorage cache purge on boot.');
} else {
  // Try alternative marker
  const altMarker = `(function() {\n  'use strict';`;
  if (content.includes(altMarker)) {
    content = content.replace(altMarker, altMarker + '\n' + initPurgeCode);
    console.log('[CloudSync] 1. Added localStorage cache purge on boot (alt).');
  } else {
    // Put at the start of DOMContentLoaded in the main script
    const bootMarker = `document.addEventListener('DOMContentLoaded', () => {`;
    content = content.replace(bootMarker, bootMarker + '\n' + initPurgeCode);
    console.log('[CloudSync] 1. Added localStorage cache purge inside DOMContentLoaded.');
  }
}

// 2. getLoadedBookings should return [] so live cloud database is loaded directly
const oldGetLoadedBookings = `  function getLoadedBookings() {
    let list = [];
    try {
      const stored = localStorage.getItem('arena_local_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      }
    } catch(e) {}
    if (list.length === 0 && window.ARENA_DEFAULT_DATA && Array.isArray(window.ARENA_DEFAULT_DATA.initialBookings)) {
      list = [...window.ARENA_DEFAULT_DATA.initialBookings];
    }
    // Higienização automática profunda: remove IDs obsoletos e contaminações entre dias
    const obsoleteIds = new Set(['ARENA-M4066', 'ARENA-M2526', 'ARENA-8673']);
    list = list.filter(b => {
      if (!b || !b.id || obsoleteIds.has(b.id)) return false;
      if (!b.start_time && !b.time) return false;
      // Higienização estrita: Davi só joga às segundas, quartas, sextas e sábados (nunca na terça 03/11)
      if ((b.customer_name === 'Davi' || (b.name && b.name.includes('Davi'))) && b.date === '2026-11-03') return false;
      return true;
    });
    return list;
  }`;

const newGetLoadedBookings = `  // 100% Cloud Database: O banco de dados na nuvem (Supabase DB1 e DB2) é a fonte de verdade absoluta
  function getLoadedBookings() {
    // Não carrega nada do localStorage local para evitar fantasmas ou dados dessincronizados
    return [];
  }`;

if (content.includes(oldGetLoadedBookings)) {
  content = content.replace(oldGetLoadedBookings, newGetLoadedBookings);
  console.log('[CloudSync] 2. getLoadedBookings updated to rely 100% on cloud database.');
} else {
  console.warn('[CloudSync] Warning: oldGetLoadedBookings exact block not found.');
}

// 3. In pullDataFromCloudDatabases, make cloudBookings the direct authoritative source of truth (no ghost bMap merging)
const oldPullMergeStart = `      // Mescla reservas com o estado operacional respeitando alterações e cancelamentos locais
      if (Array.isArray(cloudBookings) && cloudBookings.length > 0) {
        const bMap = new Map();
        (window.adminGameState.bookings || []).forEach(b => {
          if (b && b.id) bMap.set(String(b.id), b);
        });

        // Carrega lista de IDs cancelados e deletados para não permitir reversão
        let deletedIds = new Set();
        try {
          const storedDel = JSON.parse(localStorage.getItem('arena_deleted_bookings') || '[]');
          if (Array.isArray(storedDel)) deletedIds = new Set(storedDel.map(String));
        } catch(e) {}

        const finishedSlots = new Set();
        (window.adminGameState.bookings || []).forEach(b => {
          if (b && b.status === 'finished') {
            const cId = (typeof getCourtById === 'function') ? getCourtById(b.court_id || b.courtId).id : (b.court_id || '');
            finishedSlots.add(b.date + '_' + cId + '_' + b.start_time);
          }
        });

        cloudBookings.forEach(cb => {
          if (!cb || !cb.id) return;
          const idStr = String(cb.id);

          if (deletedIds.has(idStr)) return;

          const cId = (typeof getCourtById === 'function') ? getCourtById(cb.court_id || cb.courtId).id : (cb.court_id || '');
          const slotKey = cb.date + '_' + cId + '_' + cb.start_time;
          const existing = bMap.get(idStr);

          let finalStatus = cb.status || 'confirmed';
          if (existing) {
            if (existing.status === 'cancelled') {
              finalStatus = 'cancelled';
              if (cb.status !== 'cancelled' && typeof window.syncBookingToCloud === 'function') {
                window.syncBookingToCloud(existing, 'upsert');
              }
            } else if (existing.status === 'finished' || finishedSlots.has(slotKey)) {
              finalStatus = 'finished';
            } else if (existing.status === 'in_progress' || existing.status === 'live') {
              finalStatus = existing.status;
            } else if (existing.status === 'pending') {
              finalStatus = existing.status;
            }
            bMap.set(idStr, { ...cb, ...existing, status: finalStatus });
          } else {
            if (finishedSlots.has(slotKey)) {
              cb.status = 'finished';
            }
            bMap.set(idStr, cb);
            stateChanged = true;
          }
        });

        const newBookings = Array.from(bMap.values());
        const newSig = newBookings.length + '_' + newBookings.slice(0, 15).map(b => b.id + ':' + b.status + ':' + (b.payment_status || '') + ':' + (b.attendance || '')).join('|');
        if (newSig !== window.__lastBookingsSig) {
          window.__lastBookingsSig = newSig;
          stateChanged = true;
          window.adminGameState.bookings = newBookings;
          try {
            localStorage.setItem('arena_local_bookings', JSON.stringify(window.adminGameState.bookings));
          } catch(e) {}
        }
      }

      // 2. Atualiza mensalistas
      if (Array.isArray(cloudMembers) && cloudMembers.length > 0) {
        const memSig = cloudMembers.length + '_' + cloudMembers.map(m => m.id).join(',');
        if (memSig !== window.__lastMembersSig) {
          window.__lastMembersSig = memSig;
          stateChanged = true;
          window.adminGameState.monthlyMembers = cloudMembers;
          try {
            localStorage.setItem('arena_monthly_members', JSON.stringify(cloudMembers));
          } catch(e) {}
        }
      }`;

const newPullMergeCode = `      // 100% VINCULADO AO BANCO DE DADOS NA NUVEM: A nuvem é a fonte de verdade absoluta e em tempo real.
      // Se um registro foi excluído no banco, ele NÃO existe mais e NUNCA é ressuscitado.
      if (Array.isArray(cloudBookings)) {
        const newSig = cloudBookings.length + '_' + cloudBookings.slice(0, 20).map(b => b.id + ':' + b.status + ':' + (b.payment_status || '') + ':' + (b.attendance || '')).join('|');
        if (newSig !== window.__lastBookingsSig) {
          window.__lastBookingsSig = newSig;
          stateChanged = true;
          window.adminGameState.bookings = cloudBookings;
        }
      }

      // 2. Atualiza mensalistas diretamente do banco de dados na nuvem
      if (Array.isArray(cloudMembers)) {
        const memSig = cloudMembers.length + '_' + cloudMembers.map(m => m.id).join(',');
        if (memSig !== window.__lastMembersSig) {
          window.__lastMembersSig = memSig;
          stateChanged = true;
          window.adminGameState.monthlyMembers = cloudMembers;
        }
      }`;

if (content.includes(oldPullMergeStart)) {
  content = content.replace(oldPullMergeStart, newPullMergeCode);
  console.log('[CloudSync] 3. pullDataFromCloudDatabases converted to direct authoritative cloud source.');
} else {
  console.warn('[CloudSync] Warning: oldPullMergeStart block not found exactly.');
}

// 4. In syncBookingToCloud, remove arena_deleted_bookings localStorage code
const oldSyncDelStorage = `    // Se for delete, registra na lista de excluídos para imunidade contra ressuscitação
    if (action === 'delete') {
      try {
        const delList = JSON.parse(localStorage.getItem('arena_deleted_bookings') || '[]');
        if (!delList.includes(String(booking.id))) {
          delList.push(String(booking.id));
          localStorage.setItem('arena_deleted_bookings', JSON.stringify(delList));
        }
      } catch(e) {}
    }`;

const newSyncDelStorage = `    // Exclusão definitiva executada diretamente nos Bancos de Dados na Nuvem (Supabase DB1 e DB2)
    if (action === 'delete') {
      console.log('[ArenaCloud] Excluindo permanentemente do banco de dados:', booking.id);
    }`;

if (content.includes(oldSyncDelStorage)) {
  content = content.replace(oldSyncDelStorage, newSyncDelStorage);
  console.log('[CloudSync] 4. Removed arena_deleted_bookings from syncBookingToCloud.');
}

// 5. Remove all remaining localStorage.setItem('arena_local_bookings'...) and 'arena-limoeiro-games-prototype-v2'
content = content.replace(/try\s*\{\s*localStorage\.setItem\('arena_local_bookings'[\s\S]*?\}\s*catch\s*\([^\)]*\)\s*\{\}/g, '');
content = content.replace(/localStorage\.setItem\('arena_local_bookings'[^;]*;/g, '');
content = content.replace(/localStorage\.setItem\('arena-limoeiro-games-prototype-v2'[^;]*;/g, '');
content = content.replace(/localStorage\.setItem\('arena_deleted_bookings'[^;]*;/g, '');
content = content.replace(/localStorage\.setItem\('arena_monthly_members'[^;]*;/g, '');
console.log('[CloudSync] 5. Cleaned all localStorage booking persistence calls.');

// 6. Update UI note in modalities tab
const oldNote = `<b>Observação:</b> as alterações realizadas ficam salvas no armazenamento local deste dispositivo para testes operacionais imediatos sem alterar o banco de dados de produção.`;
const newNote = `<b>Conexão Nuvem Ativa:</b> todas as alterações são salvas e sincronizadas em tempo real diretamente nos Bancos de Dados Supabase (DB1 e DB2).`;

if (content.includes(oldNote)) {
  content = content.replace(oldNote, newNote);
  console.log('[CloudSync] 6. Updated UI note to reflect real cloud database sync.');
}

fs.writeFileSync(filePath, content, 'utf8');

// Validate syntax
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  try {
    new vm.Script(match[1]);
  } catch (err) {
    console.error(`Syntax error in script ${count}:`, err.message);
    process.exit(1);
  }
}

console.log(`[CloudSync] ALL ${count} scripts validated successfully with ZERO syntax errors! SUCCESS!`);
