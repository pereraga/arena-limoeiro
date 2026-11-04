const fs = require('fs');

const path = 'public/admin.html';
const content = fs.readFileSync(path, 'utf8');

// Let's test the exact edits before applying
console.log('1. Checking line 1320 (4 jogos):');
const idx1 = content.indexOf('<span class="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-800 text-white text-[9px] font-black inline-block">4 jogos</span>');
console.log('Found idx1:', idx1);

console.log('2. Checking fallback in getMatchesForDate:');
const idx2 = content.indexOf("id: 'ARENA-2913'");
console.log('Found idx2:', idx2);

console.log('3. Checking persistCourtState:');
const idx3 = content.indexOf('function persistCourtState() {');
console.log('Found idx3:', idx3);

console.log('4. Checking switchCadastrosSubTab:');
const idx4 = content.indexOf('window.switchCadastrosSubTab = function(subtabName) {');
console.log('Found idx4:', idx4);

console.log('5. Checking feed interval:');
const idx5 = content.indexOf('window.__arenaFeedAutoInterval = setInterval');
console.log('Found idx5:', idx5);
