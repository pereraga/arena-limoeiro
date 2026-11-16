const fs = require('fs');

let content = fs.readFileSync('public/admin.html', 'utf8');

const isCRLF = content.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

const fnStartIdx = content.indexOf('window.syncDirectBookingCourtOptions = function()');
const fnEndMarker = '  window.openDirectBookingModal = function() {';
const fnEndIdx = content.indexOf(fnEndMarker, fnStartIdx);

console.log('fnStartIdx:', fnStartIdx, 'fnEndIdx:', fnEndIdx);

if (fnStartIdx !== -1 && fnEndIdx !== -1) {
  const newFnCode = [
    'window.syncDirectBookingCourtOptions = function() {',
    '    const courtSelect = document.getElementById(\'directBookingCourt\');',
    '    if (!courtSelect) return;',
    '',
    '    // Se o elemento estiver com foco (usuário tocando ou com o menu suspenso aberto no APK/Android), NUNCA reescreva o DOM',
    '    if (document.activeElement === courtSelect) return;',
    '',
    '    // Busca a lista atualizada de quadras em courtState ou adminGameState ou ADMIN_COURTS',
    '    let activeCourts = [];',
    '    if (typeof courtState !== \'undefined\' && Array.isArray(courtState.courts) && courtState.courts.length > 0) {',
    '      activeCourts = courtState.courts;',
    '    } else if (window.courtState && Array.isArray(window.courtState.courts) && window.courtState.courts.length > 0) {',
    '      activeCourts = window.courtState.courts;',
    '    } else if (window.adminGameState && Array.isArray(window.adminGameState.courts) && window.adminGameState.courts.length > 0) {',
    '      activeCourts = window.adminGameState.courts;',
    '    } else if (typeof ADMIN_COURTS !== \'undefined\' && Array.isArray(ADMIN_COURTS)) {',
    '      activeCourts = ADMIN_COURTS;',
    '    }',
    '',
    '    if (!activeCourts || activeCourts.length === 0) return;',
    '',
    '    const previousVal = courtSelect.value;',
    '    let html = \'\';',
    '    activeCourts.forEach((c) => {',
    '      const priceVal = c.price ?? c.rate ?? c.normal ?? 100;',
    '      const courtName = c.name || c.id;',
    '      html += \'<option value="\' + c.id + \'">\' + courtName + \' (R$ \' + priceVal + \'/h)</option>\';',
    '    });',
    '',
    '    // Só atualiza o DOM se as opções realmente mudaram de valor ou texto (evita fechar dropdown aberto no mobile/APK)',
    '    if (courtSelect.innerHTML !== html) {',
    '      courtSelect.innerHTML = html;',
    '      if (previousVal && Array.from(courtSelect.options).some(o => o.value === previousVal)) {',
    '        courtSelect.value = previousVal;',
    '      }',
    '    }',
    '  };',
    '',
    ''
  ].join(eol);

  content = content.substring(0, fnStartIdx) + newFnCode + content.substring(fnEndIdx);
  fs.writeFileSync('public/admin.html', content, 'utf8');
  console.log('Successfully updated public/admin.html with anti-loop protection!');
}
