const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('[MoveModalities] Starting migration of Modalidades into Quadras...');

// 1. Remove Modalidades button from the top navbar
const oldTopModalitiesBtn = `        <!-- Aba 3: Modalidades -->
        <button onclick="showAdminTab('modalities')" id="btnTab-modalities" class="tab-btn tab-inactive">
          <i data-lucide="tag" class="w-4 h-4 shrink-0 text-slate-700"></i>
          <span>Modalidades</span>
          <span class="badge-count">4</span>
        </button>`;

if (content.includes(oldTopModalitiesBtn)) {
  content = content.replace(oldTopModalitiesBtn + '\n\n', '');
  console.log('[MoveModalities] 1. Removed Modalidades tab button from top navbar.');
} else {
  // Try alternative whitespace
  const regex = /\s*<!-- Aba 3: Modalidades -->\s*<button onclick="showAdminTab\('modalities'\)" id="btnTab-modalities"[\s\S]*?<\/button>/;
  if (regex.test(content)) {
    content = content.replace(regex, '');
    console.log('[MoveModalities] 1. Removed Modalidades tab button from top navbar (via regex).');
  } else {
    console.error('[MoveModalities] ERROR: Top navbar Modalidades button not found!');
    process.exit(1);
  }
}

// 2. Extract contents of panel-modalities
const panelModalitiesStart = `<section id="panel-modalities" class="space-y-6 hidden">`;
const panelModalitiesEnd = `</section>\n\n    <!-- 🟢 PAINEL 5: CADASTROS & AJUSTES -->`;

const pModStartIdx = content.indexOf(panelModalitiesStart);
const pModEndIdx = content.indexOf(panelModalitiesEnd);

if (pModStartIdx === -1 || pModEndIdx === -1) {
  console.error('[MoveModalities] ERROR: panel-modalities not found!');
  process.exit(1);
}

// Extract the inner HTML of panel-modalities
let modalitiesInnerHtml = content.substring(pModStartIdx + panelModalitiesStart.length, pModEndIdx).trim();
// Fix any stray </div> at the end of modalities
if (modalitiesInnerHtml.endsWith('</div>')) {
  // check if there's an extra div
  const openDivCount = (modalitiesInnerHtml.match(/<div\b/g) || []).length;
  const closeDivCount = (modalitiesInnerHtml.match(/<\/div>/g) || []).length;
  if (closeDivCount > openDivCount) {
    modalitiesInnerHtml = modalitiesInnerHtml.substring(0, modalitiesInnerHtml.lastIndexOf('</div>')).trim();
  }
}

// Remove panel-modalities from its old location
const fullOldModalitiesSection = content.substring(pModStartIdx, pModEndIdx + `</section>`.length);
content = content.replace(fullOldModalitiesSection, '');
console.log('[MoveModalities] 2. Extracted inner content and removed standalone panel-modalities.');

// 3. Transform panel-courts to have the sub-navigation and two subtabs
const oldCourtsStart = `    <!-- 🟢 PAINEL 2: QUADRAS -->\n    <!-- 🟢 PAINEL 2: QUADRAS (MONITOR DE QUADRAS OFICIAL) -->\n    <section id="panel-courts" class="space-y-6 hidden">`;
const oldCourtsEnd = `      <p class="footer-note">Arena Limoeiro • Painel de demonstração para gestão de quadras</p>\n    </section>`;

const courtsStartIdx = content.indexOf(oldCourtsStart);
const courtsEndIdx = content.indexOf(oldCourtsEnd);

if (courtsStartIdx === -1 || courtsEndIdx === -1) {
  console.error('[MoveModalities] ERROR: panel-courts boundaries not found!');
  process.exit(1);
}

const courtsInnerHtml = content.substring(courtsStartIdx + oldCourtsStart.length, courtsEndIdx).trim();

const newPanelCourts = `    <!-- 🟢 PAINEL 2: QUADRAS & MODALIDADES -->
    <section id="panel-courts" class="space-y-6 hidden">

      <!-- SUB-NAVEGAÇÃO INTERNA: QUADRAS & MODALIDADES (ESTILO OFICIAL DA ARENA) -->
      <div class="flex items-center gap-2 mb-2 p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/90 w-fit max-w-full shadow-2xs">
        <button type="button" id="btnCourtsSub-quadras" onclick="switchCourtsSubTab('quadras')" class="tab-btn tab-active !flex-initial" style="min-width: 140px; height: 38px;">
          <i data-lucide="layout-grid" class="w-4 h-4 shrink-0 text-white"></i>
          <span>Quadras</span>
          <span class="badge-count" id="badgeCourtsCount">6</span>
        </button>
        <button type="button" id="btnCourtsSub-modalidades" onclick="switchCourtsSubTab('modalidades')" class="tab-btn tab-inactive !flex-initial" style="min-width: 145px; height: 38px;">
          <i data-lucide="tag" class="w-4 h-4 shrink-0 text-slate-700"></i>
          <span>Modalidades</span>
          <span class="badge-count" id="badgeModalitiesCount">4</span>
        </button>
      </div>

      <!-- SUB-ABA 1: MONITOR DE QUADRAS -->
      <div id="courtsSubtab-quadras" class="space-y-6">
        ${courtsInnerHtml}
        <p class="footer-note">Arena Limoeiro • Painel de demonstração para gestão de quadras</p>
      </div>

      <!-- SUB-ABA 2: CATEGORIAS & MODALIDADES -->
      <div id="courtsSubtab-modalidades" class="space-y-6 hidden">
        ${modalitiesInnerHtml}
      </div>

    </section>`;

const fullOldCourtsSection = content.substring(courtsStartIdx, courtsEndIdx + oldCourtsEnd.length);
content = content.replace(fullOldCourtsSection, newPanelCourts);
console.log('[MoveModalities] 3. Transformed panel-courts with Quadras (6) and Modalidades (4) subtabs.');

// 4. Update showAdminTab and add switchCourtsSubTab
const oldTabsList = `    const tabsList = ['movement', 'courts', 'modalities', 'cadastros', 'reports', 'backup'];

    function showAdminTab(targetTab) {
      tabsList.forEach(t => {
        const btn = document.getElementById('btnTab-' + t);
        const panel = document.getElementById('panel-' + t);
        if (t === targetTab) {
          if (btn) {
            btn.className = 'tab-btn tab-active';
          }
          if (panel) panel.classList.remove('hidden');
        } else {
          if (btn) {
            btn.className = 'tab-btn tab-inactive';
          }
          if (panel) panel.classList.add('hidden');
        }
      });
      lucide.createIcons();
      if (typeof renderSpacesGrid === 'function' && (targetTab === 'modalities' || targetTab === 'cadastros')) renderSpacesGrid();
      if (typeof renderCourtsMonitor === 'function' && targetTab === 'courts') renderCourtsMonitor();
    }`;

const newTabsList = `    const tabsList = ['movement', 'courts', 'cadastros', 'reports', 'backup'];

    window.switchCourtsSubTab = function(sub) {
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
    };

    function showAdminTab(targetTab) {
      if (targetTab === 'modalities') {
        showAdminTab('courts');
        if (typeof window.switchCourtsSubTab === 'function') {
          window.switchCourtsSubTab('modalidades');
        }
        return;
      }
      tabsList.forEach(t => {
        const btn = document.getElementById('btnTab-' + t);
        const panel = document.getElementById('panel-' + t);
        if (t === targetTab) {
          if (btn) {
            btn.className = 'tab-btn tab-active';
          }
          if (panel) panel.classList.remove('hidden');
        } else {
          if (btn) {
            btn.className = 'tab-btn tab-inactive';
          }
          if (panel) panel.classList.add('hidden');
        }
      });
      lucide.createIcons();
      if (typeof renderSpacesGrid === 'function' && targetTab === 'cadastros') renderSpacesGrid();
      if (typeof renderCourtsMonitor === 'function' && targetTab === 'courts') renderCourtsMonitor();
    }`;

if (content.includes(oldTabsList)) {
  content = content.replace(oldTabsList, newTabsList);
  console.log('[MoveModalities] 4. Added switchCourtsSubTab and updated showAdminTab.');
} else {
  console.error('[MoveModalities] ERROR: oldTabsList not found!');
  process.exit(1);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('[MoveModalities] Successfully updated public/admin.html.');

// Validate syntax of all script blocks
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  try {
    new vm.Script(match[1]);
  } catch (err) {
    console.error(`Syntax error in <script> block ${count}:`, err.message);
    process.exit(1);
  }
}

console.log(`[MoveModalities] ALL ${count} <script> blocks validated with ZERO syntax errors! SUCCESS!`);
