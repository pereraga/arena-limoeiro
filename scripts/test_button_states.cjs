const fs = require('fs');
const path = require('path');
const vm = require('vm');

const defaultDataCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'default-data.js'), 'utf8');
const adminCode = fs.readFileSync(path.join(__dirname, '..', 'public', 'admin.html'), 'utf8');

const elements = {};
function getOrCreateEl(id) {
  if (!elements[id]) {
    elements[id] = {
      id: id,
      value: '',
      textContent: '',
      className: '',
      innerHTML: '',
      style: { display: '' },
      classList: { contains: () => false, add: () => {}, remove: () => {} },
      querySelector: () => null,
      querySelectorAll: () => [],
      appendChild: (child) => {
        if (!elements[id].children) elements[id].children = [];
        elements[id].children.push(child);
      }
    };
  }
  return elements[id];
}

const domMock = {
  window: {},
  document: {
    getElementById: (id) => getOrCreateEl(id),
    querySelector: (sel) => null,
    querySelectorAll: (sel) => [],
    createElement: (tag) => ({ tagName: tag, className: '', innerHTML: '', children: [] }),
    addEventListener: () => {},
    activeElement: null
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  console: console,
  Set: Set, Array: Array, Math: Math, Date: Date,
  parseInt: parseInt, parseFloat: parseFloat, Number: Number, String: String,
  encodeURIComponent: encodeURIComponent,
  setInterval: () => 123, clearInterval: () => {}, setTimeout: () => 456, clearTimeout: () => {},
  location: { search: '', hash: '' },
  navigator: { userAgent: 'Node' }
};
domMock.window = domMock;
domMock.global = domMock;

vm.createContext(domMock);
vm.runInContext(defaultDataCode, domMock);

const scriptMatches = adminCode.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi);
const mainScript = scriptMatches.reduce((a, b) => a.length > b.length ? a : b).replace(/<\/?script[^>]*>/gi, '');

vm.runInContext(mainScript, domMock);

console.log('--- Testing Match Button States ---');
const day4Matches = domMock.window.getMatchesForDate('2026-11-04');
const m1 = day4Matches[0]; // Davi
console.log('Match 1 status before start:', m1.status);

// 1. Initial State: should have GREEN button "Iniciar Jogo na Quadra"
const htmlBefore = domMock.window.renderMatchCardHtml(m1, true);

const hasGreenBtn = htmlBefore.includes('Iniciar Jogo na Quadra') && htmlBefore.includes('bg-emerald-700');
const hasRedBtnBefore = htmlBefore.includes('btn-main-action-' + m1.id) && htmlBefore.includes('Finalizar');
console.log('Initial Top Button is GREEN (Iniciar Jogo na Quadra):', hasGreenBtn ? 'PASS' : 'FAIL');
console.log('Initial Top Button is NOT RED:', !hasRedBtnBefore ? 'PASS' : 'FAIL');

// 2. Check Secondary Actions Row (Matching Image 2 - green underline)
const secondarySection = htmlBefore.substring(htmlBefore.indexOf('<!-- BOTÕES DE GESTÃO SECUNDÁRIA'), htmlBefore.indexOf('<!-- HISTÓRICO E LINHA DO TEMPO'));
console.log('Secondary Section Length:', secondarySection.length);

const secHasEditGame = secondarySection.includes('Editar jogo');
const secHasEditContract = secondarySection.includes('Editar contrato');
const secHasNoShow = secondarySection.includes('Não compareceu');
const secHasCancel = secondarySection.includes('Cancelar partida');
const secHasDuplicateStart = secondarySection.includes('Iniciar Jogo na Quadra');
const secHasDuplicateFinish = secondarySection.includes('Finalizar');

console.log('Secondary Row has Editar jogo:', secHasEditGame ? 'PASS' : 'FAIL');
console.log('Secondary Row has Editar contrato:', secHasEditContract ? 'PASS' : 'FAIL');
console.log('Secondary Row has Não compareceu:', secHasNoShow ? 'PASS' : 'FAIL');
console.log('Secondary Row has Cancelar partida:', secHasCancel ? 'PASS' : 'FAIL');
console.log('Secondary Row has NO duplicate Iniciar Jogo:', !secHasDuplicateStart ? 'PASS' : 'FAIL');
console.log('Secondary Row has NO duplicate Finalizar:', !secHasDuplicateFinish ? 'PASS' : 'FAIL');

if (!hasGreenBtn || hasRedBtnBefore || !secHasEditGame || !secHasEditContract || !secHasNoShow || !secHasCancel || secHasDuplicateStart || secHasDuplicateFinish) {
  console.error('Initial button state check FAILED!');
  process.exit(1);
}

// 3. Test starting the match: handleGameMainAction(m1.id)
console.log('\n--- Clicking Iniciar Jogo na Quadra ---');
domMock.window.handleGameMainAction(m1.id);

// Fetch updated game object from state
const mUpdated = domMock.window.getGame(m1.id);
console.log('Match 1 status after click:', mUpdated.status);
console.log('Match 1 attendance after click:', mUpdated.attendance);

// Re-render: should now have RED button "Finalizar"
const htmlAfterStart = domMock.window.renderMatchCardHtml(mUpdated, true);
const hasRedBtnAfter = htmlAfterStart.includes('btn-main-action-' + m1.id) && htmlAfterStart.includes('Finalizar') && htmlAfterStart.includes('bg-gradient-to-r from-red-600 to-rose-700');
console.log('Top Button is now RED (Finalizar):', hasRedBtnAfter ? 'PASS' : 'FAIL');

if (!hasRedBtnAfter || mUpdated.status !== 'live') {
  console.error('After-start button state check FAILED!');
  process.exit(1);
}

console.log('\nALL BUTTON STATE AND SECONDARY ROW CHECKS PASSED 100%!');
