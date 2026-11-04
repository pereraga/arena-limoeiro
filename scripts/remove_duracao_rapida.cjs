const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let html = fs.readFileSync(adminPath, 'utf8');

const startMarker = '<!-- SELEÇÃO RÁPIDA DE DURAÇÃO -->';
const endMarker = '<!-- JANELAS SEPARADAS DE HORÁRIOS (SLOTS DE 30 EM 30 MINUTOS) -->';

const idxStart = html.indexOf(startMarker);
const idxEnd = html.indexOf(endMarker);

if (idxStart !== -1 && idxEnd !== -1) {
  html = html.substring(0, idxStart) + html.substring(idxEnd);
  fs.writeFileSync(adminPath, html, 'utf8');
  console.log('✅ Barra de Duração Rápida removida com sucesso!');
} else {
  console.error('❌ Marcadores não encontrados:', idxStart, idxEnd);
  process.exit(1);
}
