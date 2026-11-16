const fs = require('fs');
const repoRoot = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const filePath = repoRoot + '/public/admin.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Atualizar meta viewport para bloquear zoom acidental no mobile
const oldViewport = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
const newViewport = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">';

if (!content.includes(oldViewport)) {
  console.error('oldViewport not found!');
  process.exit(1);
}
content = content.replace(oldViewport, newViewport);
console.log('1. Viewport updated with maximum-scale=1.0, user-scalable=no');

// 2. Adicionar estilos CSS globais para evitar zoom automático do iOS/Android em inputs e toques rápidos
const oldStyleStart = `<style>
    body { font-family: 'Inter', sans-serif; }`;

const newStyleStart = `<style>
    body { font-family: 'Inter', sans-serif; }

    /* PREVENÇÃO TOTAL DE ZOOM INDESEJADO NO MOBILE */
    html, body {
      touch-action: pan-x pan-y;
      -webkit-text-size-adjust: 100%;
    }
    input, select, textarea {
      font-size: 16px !important; /* Previne zoom automático do Safari/iOS ao focar no campo */
    }
    @media (min-width: 640px) {
      input, select, textarea {
        font-size: inherit !important;
      }
    }`;

if (!content.includes(oldStyleStart)) {
  console.error('oldStyleStart not found!');
  process.exit(1);
}
content = content.replace(oldStyleStart, newStyleStart);
console.log('2. Input font-size and touch-action rules added to <style>');

// 3. Corrigir cálculo da duração em handleSaveDirectBooking
const oldNewBooking = `    const newBooking = {
      id: bookingId,
      court_id: dbCourtId,
      customer_name: name,
      customer_phone: phone,
      customer_cpf: cpf,
      date: date,
      start_time: start,
      end_time: end,
      time: start + ' às ' + end,
      duration: 60,
      total_price: price,
      status: 'confirmed',
      booking_type: 'avulso',
      payment_method: payment,
      observation: obs,
      created_at: new Date().toISOString()
    };`;

const newNewBooking = `    const startM = parseTimeToMinutes(start);
    let endM = parseTimeToMinutes(end);
    let calcDuration = endM - startM;
    if (calcDuration <= 0) calcDuration += 1440;

    const newBooking = {
      id: bookingId,
      court_id: dbCourtId,
      customer_name: name,
      customer_phone: phone,
      customer_cpf: cpf,
      date: date,
      start_time: start,
      end_time: end,
      time: start + ' às ' + end,
      duration: calcDuration,
      total_price: price,
      status: 'confirmed',
      booking_type: 'avulso',
      payment_method: payment,
      observation: obs,
      created_at: new Date().toISOString()
    };`;

if (!content.includes(oldNewBooking)) {
  console.error('oldNewBooking not found!');
  process.exit(1);
}
content = content.replace(oldNewBooking, newNewBooking);
console.log('3. Fixed duration calculation in handleSaveDirectBooking');

// 4. Corrigir saveEditGame para atualizar g.time e calcular duração exata
const oldSaveEditGameSnippet = `    g.start_time = newStart;
    g.start = newStart;
    g.end_time = newEnd;
    g.end = newEnd;
    g.late = newLate;
    g.lateReason = newLateReason;`;

const newSaveEditGameSnippet = `    g.start_time = newStart;
    g.start = newStart;
    g.end_time = newEnd;
    g.end = newEnd;
    g.time = newStart + ' às ' + newEnd;
    const editSm = parseTimeToMinutes(newStart);
    let editEm = parseTimeToMinutes(newEnd);
    let editDur = editEm - editSm;
    if (editDur <= 0) editDur += 1440;
    g.duration = editDur;
    g.late = newLate;
    g.lateReason = newLateReason;`;

if (!content.includes(oldSaveEditGameSnippet)) {
  console.error('oldSaveEditGameSnippet not found!');
  process.exit(1);
}
content = content.replace(oldSaveEditGameSnippet, newSaveEditGameSnippet);
console.log('4. Fixed g.time and g.duration in saveEditGame');

// 5. Corrigir lógica de seleção de horários em toggleBalcaoTimeSlot
// Quando o usuário clica em um horário com seleção já existente:
// Se clicar em um horário maior que curStartMin, define o FIM como sendo exatamente esse horário (+30min se for mesmo do início)
const oldToggleLogic = `    // 1. Se NÃO há seleção ativa ainda (início da marcação pelo usuário):
    if (!hasExistingSelection) {
      window.__balcaoHasUserInteracted = true;
      forceSelectValue(startSelect, slotTime);
      const defEnd = !hasConflict(clickedMin, clickedMin + 30) ? (clickedMin + 30) : (clickedMin + 60);
      forceSelectValue(endSelect, formatMinutesToTime(defEnd));
    }
    // 2. Clique ALÉM do Fim atual → EXPANDE para frente (sem limite de horas/blocos: 2h, 3h, 5h+)
    else if (clickedMin > curEndMin) {
      if (!hasConflict(curStartMin, clickedMin)) {
        forceSelectValue(endSelect, slotTime);
      } else {
        // Conflito no caminho: inicia nova seleção no slot clicado
        forceSelectValue(startSelect, slotTime);
        forceSelectValue(endSelect, formatMinutesToTime(clickedMin + 30));
      }
    }
    // 3. Clique ANTES do Início atual → EXPANDE para trás (sem limite)
    else if (clickedMin < curStartMin) {
      if (!hasConflict(clickedMin, curEndMin)) {
        forceSelectValue(startSelect, slotTime);
      } else {
        // Conflito: inicia nova seleção
        forceSelectValue(startSelect, slotTime);
        forceSelectValue(endSelect, formatMinutesToTime(clickedMin + 30));
      }
    }
    // 4. Clique NO slot de Fim exato → se > 30min reduz 30min; se já for 30min amplia para 1h
    else if (clickedMin === curEndMin) {
      const duration = curEndMin - curStartMin;
      if (duration > 30) {
        forceSelectValue(endSelect, formatMinutesToTime(curEndMin - 30));
      } else if (!hasConflict(curEndMin, curEndMin + 30)) {
        forceSelectValue(endSelect, formatMinutesToTime(curEndMin + 30));
      }
    }
    // 5. Clique NO slot de Início exato → REMOVE 30min do início (avança o início)
    else if (clickedMin === curStartMin) {
      const duration = curEndMin - curStartMin;
      if (duration > 30) {
        forceSelectValue(startSelect, formatMinutesToTime(curStartMin + 30));
      }
    }
    // 6. Clique em slot INTERMEDIÁRIO (dentro do intervalo) → CORTA o Fim naquele ponto (remove bloco completo)
    else {
      // curStartMin < clickedMin < curEndMin
      // Reduz a seleção: o novo Fim passa a ser o slot clicado
      forceSelectValue(endSelect, slotTime);
    }`;

const newToggleLogic = `    // 1. Se NÃO há seleção ativa ainda (início da marcação pelo usuário):
    if (!hasExistingSelection) {
      window.__balcaoHasUserInteracted = true;
      forceSelectValue(startSelect, slotTime);
      // Padrão amigável: jogo de 1 hora (60 minutos) se não houver conflito, senão 30 minutos
      const defEnd = !hasConflict(clickedMin, clickedMin + 60) ? (clickedMin + 60) : (!hasConflict(clickedMin, clickedMin + 30) ? (clickedMin + 30) : (clickedMin + 60));
      forceSelectValue(endSelect, formatMinutesToTime(defEnd));
    }
    // 2. Clique no mesmo horário de INÍCIO já selecionado:
    else if (clickedMin === curStartMin) {
      // Se for apenas 30 minutos, expande para 1 hora
      if (curEndMin - curStartMin === 30 && !hasConflict(curStartMin, curStartMin + 60)) {
        forceSelectValue(endSelect, formatMinutesToTime(curStartMin + 60));
      } else {
        // Limpa ou redefine o início
        forceSelectValue(startSelect, slotTime);
        forceSelectValue(endSelect, formatMinutesToTime(clickedMin + 60));
      }
    }
    // 3. Clique em horário POSTERIOR ao início:
    else if (clickedMin > curStartMin) {
      // O horário clicado é o bloco desejado. Como cada bloco tem 30 min, o término do jogo abrange esse bloco até (clickedMin + 30)
      const targetEndMin = (clickedMin === curEndMin) ? clickedMin : (clickedMin + 30);
      if (!hasConflict(curStartMin, targetEndMin)) {
        forceSelectValue(endSelect, formatMinutesToTime(targetEndMin));
      } else {
        // Conflito no caminho: inicia nova seleção no slot clicado
        forceSelectValue(startSelect, slotTime);
        forceSelectValue(endSelect, formatMinutesToTime(clickedMin + 60));
      }
    }
    // 4. Clique em horário ANTERIOR ao início:
    else if (clickedMin < curStartMin) {
      if (!hasConflict(clickedMin, curEndMin)) {
        forceSelectValue(startSelect, slotTime);
      } else {
        // Conflito: inicia nova seleção a partir do horário clicado
        forceSelectValue(startSelect, slotTime);
        forceSelectValue(endSelect, formatMinutesToTime(clickedMin + 60));
      }
    }`;

if (!content.includes(oldToggleLogic)) {
  console.error('oldToggleLogic not found!');
  process.exit(1);
}
content = content.replace(oldToggleLogic, newToggleLogic);
console.log('5. Fixed toggleBalcaoTimeSlot click selection logic');

fs.writeFileSync(filePath, content, 'utf8');
console.log('All mobile zoom and booking hour fixes applied to admin.html successfully!');
