const fs = require('fs');

const path = 'public/admin.html';
let content = fs.readFileSync(path, 'utf8');

console.log('Original content length:', content.length);

// 1. Update toggleDetails function
const oldToggleDetails = `window.toggleDetails = function(id) {
    const el = document.getElementById('details-' + id);
    if (el) {
      if (el.style.display === 'none' || el.classList.contains('hidden')) {
        el.style.display = 'block';
        el.classList.remove('hidden');
      } else {
        el.style.display = 'none';
        el.classList.add('hidden');
      }
    }
    if (window.lucide) lucide.createIcons();
  };`;

const newToggleDetails = `window.toggleDetails = function(id) {
    if (!window.__openDetailsIds) window.__openDetailsIds = new Set();
    const strId = String(id);
    const el = document.getElementById('details-' + strId);
    const arrowEl = document.getElementById('arrow-details-' + strId);
    if (el) {
      const isHidden = (el.style.display === 'none' || el.classList.contains('hidden'));
      if (isHidden) {
        el.style.display = 'block';
        el.classList.remove('hidden');
        window.__openDetailsIds.add(strId);
        if (arrowEl) arrowEl.textContent = '▴';
      } else {
        el.style.display = 'none';
        el.classList.add('hidden');
        window.__openDetailsIds.delete(strId);
        if (arrowEl) arrowEl.textContent = '▾';
      }
    }
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  };`;

if (content.includes(oldToggleDetails)) {
  content = content.replace(oldToggleDetails, newToggleDetails);
  console.log('✓ Successfully updated toggleDetails to use window.__openDetailsIds');
} else {
  console.warn('! Could not find oldToggleDetails directly, trying regex...');
  const regToggle = /window\.toggleDetails\s*=\s*function\(id\)\s*\{[\s\S]*?if\s*\(window\.lucide\)\s*lucide\.createIcons\(\);\s*\};/;
  if (regToggle.test(content)) {
    content = content.replace(regToggle, newToggleDetails);
    console.log('✓ Replaced toggleDetails via regex');
  } else {
    console.error('❌ Failed to locate toggleDetails');
  }
}

// 2. In renderMatchCardHtml: compute isPanelOpen
const oldRmcStart = `function renderMatchCardHtml(m, isNextUpcoming) {
    const court = getCourtById(m.court_id || m.courtId);`;

const newRmcStart = `function renderMatchCardHtml(m, isNextUpcoming) {
    const isPanelOpen = !!(window.__openDetailsIds && window.__openDetailsIds.has(String(m.id)));
    const court = getCourtById(m.court_id || m.courtId);`;

if (content.includes(oldRmcStart)) {
  content = content.replace(oldRmcStart, newRmcStart);
  console.log('✓ Injected isPanelOpen at top of renderMatchCardHtml');
} else {
  console.warn('! Could not find oldRmcStart');
}

// 3. In renderMatchCardHtml: update button and panel markup
const oldToggleMarkup = `<button type="button" class="booking-detail-toggle booking-toggle-btn" onclick="toggleDetails('\${m.id}')">
            <span>Detalhes e ações</span>
            <span>▾</span>
          </button>
        </div>

        <!-- Seção Expansível -->
        <div class="booking-expanded-panel hidden" id="details-\${m.id}" style="display:none;">`;

const newToggleMarkup = `<button type="button" class="booking-detail-toggle booking-toggle-btn" onclick="toggleDetails('\${m.id}')">
            <span>Detalhes e ações</span>
            <span id="arrow-details-\${m.id}">\${isPanelOpen ? '▴' : '▾'}</span>
          </button>
        </div>

        <!-- Seção Expansível (Preserva estado aberto durante sincronizações) -->
        <div class="booking-expanded-panel \${isPanelOpen ? '' : 'hidden'}" id="details-\${m.id}" style="\${isPanelOpen ? 'display:block;' : 'display:none;'}">`;

if (content.includes(oldToggleMarkup)) {
  content = content.replace(oldToggleMarkup, newToggleMarkup);
  console.log('✓ Updated toggle markup and expanded-panel to preserve open state');
} else {
  console.warn('! Could not find oldToggleMarkup directly, trying regex...');
  const regMarkup = /<button type="button" class="booking-detail-toggle booking-toggle-btn" onclick="toggleDetails\('\$\{m\.id\}'\)">[\s\S]*?<div class="booking-expanded-panel hidden" id="details-\$\{m\.id\}" style="display:none;">/;
  if (regMarkup.test(content)) {
    content = content.replace(regMarkup, newToggleMarkup);
    console.log('✓ Replaced toggle markup via regex');
  } else {
    console.error('❌ Failed to locate toggle markup');
  }
}

// 4. In renderMovementMatches: before rendering, preserve any open panels in the DOM
const oldRmmContainerCheck = `if (!container) return;`;

const newRmmContainerCheck = `if (!container) return;
    if (!window.__openDetailsIds) window.__openDetailsIds = new Set();
    // Garante persistência dos painéis de detalhes que estejam abertos no DOM
    container.querySelectorAll('.booking-expanded-panel').forEach(p => {
      if (p.style.display !== 'none' && !p.classList.contains('hidden')) {
        const pid = p.id.replace('details-', '');
        if (pid) window.__openDetailsIds.add(String(pid));
      }
    });`;

if (content.includes(oldRmmContainerCheck)) {
  content = content.replace(oldRmmContainerCheck, newRmmContainerCheck);
  console.log('✓ Added DOM open-panels harvesting before re-rendering container');
} else {
  console.warn('! Could not find oldRmmContainerCheck');
}

fs.writeFileSync(path, content, 'utf8');
console.log('✓ Saved public/admin.html');
