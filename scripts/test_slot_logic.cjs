function parseTimeToMinutes(t) {
  if (!t) return 0;
  const parts = t.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
}

function formatMinutesToTime(m) {
  let normalized = ((m % 1440) + 1440) % 1440;
  const hh = String(Math.floor(normalized / 60)).padStart(2, '0');
  const mm = String(normalized % 60).padStart(2, '0');
  return hh + ':' + mm;
}

// Mock DOM Select
class MockSelect {
  constructor(initialVal) {
    this.options = [];
    this.value = initialVal;
  }
  add(opt) {
    this.options.push(opt);
  }
}

let startSelect = new MockSelect('19:00');
let endSelect = new MockSelect('20:00');
let hasInteracted = false;
let occupiedRanges = []; // sem conflito

const forceSelectValue = (sel, val) => {
  if (!sel || !val) return;
  let opt = sel.options.find(o => o.value === val);
  if (!opt) {
    opt = { value: val, text: val };
    sel.add(opt);
  }
  sel.value = val;
};

const hasConflict = (fromM, toM) => {
  const s = Math.min(fromM, toM);
  const e = Math.max(fromM, toM);
  return occupiedRanges.some(r => Math.max(s, r.start) < Math.min(e, r.end));
};

function toggleSlot(slotTime) {
  const clickedMin = parseTimeToMinutes(slotTime);
  let curStartMin = parseTimeToMinutes(startSelect.value);
  let curEndMin = parseTimeToMinutes(endSelect.value);

  // 1. Primeiro clique
  if (!hasInteracted) {
    forceSelectValue(startSelect, slotTime);
    const defEnd = !hasConflict(clickedMin, clickedMin + 30) ? (clickedMin + 30) : (clickedMin + 60);
    forceSelectValue(endSelect, formatMinutesToTime(defEnd));
    hasInteracted = true;
  }
  // 2. Clique ALÉM do Fim atual
  else if (clickedMin > curEndMin) {
    if (!hasConflict(curStartMin, clickedMin)) {
      forceSelectValue(endSelect, slotTime);
    } else {
      forceSelectValue(startSelect, slotTime);
      forceSelectValue(endSelect, formatMinutesToTime(clickedMin + 30));
    }
  }
  // 3. Clique ANTES do Início atual
  else if (clickedMin < curStartMin) {
    if (!hasConflict(clickedMin, curEndMin)) {
      forceSelectValue(startSelect, slotTime);
    } else {
      forceSelectValue(startSelect, slotTime);
      forceSelectValue(endSelect, formatMinutesToTime(clickedMin + 30));
    }
  }
  // 4. Clique NO slot de Fim exato -> reduz 30 min
  else if (clickedMin === curEndMin) {
    const duration = curEndMin - curStartMin;
    if (duration > 30) {
      forceSelectValue(endSelect, formatMinutesToTime(curEndMin - 30));
    }
  }
  // 5. Clique NO slot de Início exato -> avança 30 min
  else if (clickedMin === curStartMin) {
    const duration = curEndMin - curStartMin;
    if (duration > 30) {
      forceSelectValue(startSelect, formatMinutesToTime(curStartMin + 30));
    }
  }
  // 6. Clique em slot INTERMEDIÁRIO -> corta o bloco completo até ali
  else {
    forceSelectValue(endSelect, slotTime);
  }

  const sMin = parseTimeToMinutes(startSelect.value);
  const eMin = parseTimeToMinutes(endSelect.value);
  const diff = eMin - sMin;
  const blocks = Math.round(diff / 30);
  return { start: startSelect.value, end: endSelect.value, diffMin: diff, blocks };
}

// EXECUTA OS TESTES
console.log('--- TESTE DE SELEÇÃO CONTÍNUA SEM LIMITE DE BLOCOS ---');

// Clique 1: 10:30
let res = toggleSlot('10:30');
console.log('1. Clique 10:30 ->', res.start, 'às', res.end, '| blocos:', res.blocks, '(esperado 10:30 às 11:00, 1 bloco)');

// Clique 2: 11:30 (quer 1h de jogo)
res = toggleSlot('11:30');
console.log('2. Clique 11:30 ->', res.start, 'às', res.end, '| blocos:', res.blocks, '(esperado 10:30 às 11:30, 2 blocos - 1h)');

// Clique 3: 12:00 (quer 1h30 de jogo = 3 blocos)
res = toggleSlot('12:00');
console.log('3. Clique 12:00 ->', res.start, 'às', res.end, '| blocos:', res.blocks, '(esperado 10:30 às 12:00, 3 blocos - 1h30)');

// Clique 4: 12:30 (quer 2h de jogo = 4 blocos)
res = toggleSlot('12:30');
console.log('4. Clique 12:30 ->', res.start, 'às', res.end, '| blocos:', res.blocks, '(esperado 10:30 às 12:30, 4 blocos - 2h)');

// Clique 5: 13:00 (5 blocos)
res = toggleSlot('13:00');
console.log('5. Clique 13:00 ->', res.start, 'às', res.end, '| blocos:', res.blocks, '(esperado 10:30 às 13:00, 5 blocos - 2h30)');

// Clique 6: 15:30 (10 blocos = 5 horas de jogo!)
res = toggleSlot('15:30');
console.log('6. Clique 15:30 ->', res.start, 'às', res.end, '| blocos:', res.blocks, '(esperado 10:30 às 15:30, 10 blocos - 5h)');

// Clique 7: Fim exato (15:30) -> reduz 30 min
res = toggleSlot('15:30');
console.log('7. Clique no Fim 15:30 ->', res.start, 'às', res.end, '| blocos:', res.blocks, '(esperado 10:30 às 15:00, reduz 30 min)');

// Clique 8: Intermediário (12:00) -> corta o bloco completo de 12:00 até 15:00
res = toggleSlot('12:00');
console.log('8. Clique no meio 12:00 ->', res.start, 'às', res.end, '| blocos:', res.blocks, '(esperado 10:30 às 12:00, cortou bloco)');

// Clique 9: Início exato (10:30) -> avança 30 min do início
res = toggleSlot('10:30');
console.log('9. Clique no Início 10:30 ->', res.start, 'às', res.end, '| blocos:', res.blocks, '(esperado 11:00 às 12:00, avança início)');

console.log('\nTODOS OS CENÁRIOS ATENDIDOS!');
