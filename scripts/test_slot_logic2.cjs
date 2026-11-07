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
let occupiedRanges = [];

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

  // 1. Primeiro clique após abrir o modal
  if (!hasInteracted) {
    hasInteracted = true;
    // Se o usuário clicou além do fim sugerido (ex: sugerido 19h-20h e ele clica 20:30 ou 21:00)
    if (clickedMin > curEndMin && (clickedMin - curEndMin <= 180) && !hasConflict(curStartMin, clickedMin)) {
      forceSelectValue(endSelect, slotTime);
    }
    // Se clicou no fim sugerido: reduz 30 min
    else if (clickedMin === curEndMin) {
      if (curEndMin - curStartMin > 30) {
        forceSelectValue(endSelect, formatMinutesToTime(curEndMin - 30));
      }
    }
    // Se clicou antes do início sugerido e perto (ex: 18:30): expande para trás
    else if (clickedMin < curStartMin && (curStartMin - clickedMin <= 120) && !hasConflict(clickedMin, curEndMin)) {
      forceSelectValue(startSelect, slotTime);
    }
    // Caso padrão do 1º clique: define início no slot clicado e fim = slot + 30min (ou 60min)
    else {
      forceSelectValue(startSelect, slotTime);
      const defEnd = !hasConflict(clickedMin, clickedMin + 30) ? (clickedMin + 30) : (clickedMin + 60);
      forceSelectValue(endSelect, formatMinutesToTime(defEnd));
    }
  }
  // 2. Demais cliques:
  // Clique ALÉM do Fim atual
  else if (clickedMin > curEndMin) {
    if (!hasConflict(curStartMin, clickedMin)) {
      forceSelectValue(endSelect, slotTime);
    } else {
      forceSelectValue(startSelect, slotTime);
      forceSelectValue(endSelect, formatMinutesToTime(clickedMin + 30));
    }
  }
  // Clique ANTES do Início atual
  else if (clickedMin < curStartMin) {
    if (!hasConflict(clickedMin, curEndMin)) {
      forceSelectValue(startSelect, slotTime);
    } else {
      forceSelectValue(startSelect, slotTime);
      forceSelectValue(endSelect, formatMinutesToTime(clickedMin + 30));
    }
  }
  // Clique NO Fim exato -> reduz 30 min
  else if (clickedMin === curEndMin) {
    const duration = curEndMin - curStartMin;
    if (duration > 30) {
      forceSelectValue(endSelect, formatMinutesToTime(curEndMin - 30));
    }
  }
  // Clique NO Início exato -> avança 30 min
  else if (clickedMin === curStartMin) {
    const duration = curEndMin - curStartMin;
    if (duration > 30) {
      forceSelectValue(startSelect, formatMinutesToTime(curStartMin + 30));
    }
  }
  // Clique em INTERMEDIÁRIO -> corta o bloco completo até o slot clicado
  else {
    forceSelectValue(endSelect, slotTime);
  }

  const sMin = parseTimeToMinutes(startSelect.value);
  const eMin = parseTimeToMinutes(endSelect.value);
  const diff = eMin - sMin;
  const blocks = Math.round(diff / 30);
  return { start: startSelect.value, end: endSelect.value, diffMin: diff, blocks };
}

// TESTE 1: Modal abre com 19:00 às 20:00. Usuário quer clicar em 20:30 para adicionar 30 min!
console.log('TESTE 1: Modal abre 19h-20h, usuário clica 20:30 logo de início:');
let res = toggleSlot('20:30');
console.log('Resultado:', res.start, 'às', res.end, '| blocos:', res.blocks, '(esperado 19:00 às 20:30)');

// TESTE 2: Reset e teste novo agendamento a partir de 10:30
startSelect = new MockSelect('19:00');
endSelect = new MockSelect('20:00');
hasInteracted = false;
console.log('\nTESTE 2: Modal abre 19h-20h, usuário clica 10:30 (longe):');
res = toggleSlot('10:30');
console.log('Clique 1: 10:30 ->', res.start, 'às', res.end, '| blocos:', res.blocks);

res = toggleSlot('11:00');
console.log('Clique 2: 11:00 ->', res.start, 'às', res.end, '| blocos:', res.blocks);

res = toggleSlot('11:30');
console.log('Clique 3: 11:30 ->', res.start, 'às', res.end, '| blocos:', res.blocks);

res = toggleSlot('12:00');
console.log('Clique 4: 12:00 ->', res.start, 'às', res.end, '| blocos:', res.blocks);

res = toggleSlot('12:30');
console.log('Clique 5: 12:30 ->', res.start, 'às', res.end, '| blocos:', res.blocks);

res = toggleSlot('13:00');
console.log('Clique 6: 13:00 ->', res.start, 'às', res.end, '| blocos:', res.blocks);

res = toggleSlot('13:00');
console.log('Clique 7: 13:00 (Fim) ->', res.start, 'às', res.end, '| blocos:', res.blocks, '(reduz 30 min)');

res = toggleSlot('11:30');
console.log('Clique 8: 11:30 (meio) ->', res.start, 'às', res.end, '| blocos:', res.blocks, '(corta bloco de uma vez)');
