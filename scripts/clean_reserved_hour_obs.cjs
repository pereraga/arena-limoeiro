const fs = require('fs');

const path = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Localizar o bloco onde 'observation' é atribuída no renderMatchCard
const targetObsDef = `    const observation = m.observation || m.note || (m.dayFixed ? 'Horário Fixo Semanal (' + m.dayFixed + ')' : (isMensalista ? 'Horário Fixo Semanal (QUARTA)' : 'Reserva Confirmada'));`;

// Nova lógica de limpeza da observação para exibição no card de Horário Reservado:
const newObsDef = `    // Limpeza de metadados técnicos (CPF, Emergência, Contrato, etc.) para exibição limpa no Horário Reservado
    let rawObs = m.observation || m.note || '';
    if (rawObs) {
      // Remove blocos como [CPF: ...], [Emergência: ...], {Jogo ...}, [Horário: ...]
      rawObs = rawObs
        .replace(/\\[CPF:[^\\]]*\\]/gi, '')
        .replace(/\\[Emergência:[^\\]]*\\]/gi, '')
        .replace(/\\[Emergencia:[^\\]]*\\]/gi, '')
        .replace(/\\{[^}]*\\}/gi, '')
        .replace(/\\[Horário:[^\\]]*\\]/gi, '')
        .replace(/\\[Horario:[^\\]]*\\]/gi, '')
        .replace(/\\s*\\|\\s*/g, ' ')
        .trim();
    }
    const observation = rawObs || (m.dayFixed ? 'Horário Fixo Semanal (' + m.dayFixed + ')' : (isMensalista ? 'Horário Fixo Semanal' : 'Reserva Confirmada'));`;

if (!content.includes(targetObsDef)) {
  console.error('Error: targetObsDef not found in admin.html!');
  process.exit(1);
}

content = content.replace(targetObsDef, newObsDef);
console.log('Successfully updated observation cleaner in admin.html!');

fs.writeFileSync(path, content, 'utf8');
