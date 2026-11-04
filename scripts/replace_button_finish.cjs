const fs = require('fs');

let content = fs.readFileSync('public/admin.html', 'utf8');

const targetStr = `<span class="btn-ball-icon" style="font-size: 15px; line-height: 1;">⚽</span>
                  <span>\${isFutureDay ? 'Concluir Jogo' : 'Finalizar / Receber Bola'}</span>`;

const replacementStr = `<span class="btn-finish-check-icon" style="font-size: 14px; line-height: 1; font-weight: 900;">✓</span>
                  <span>Finalizar</span>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log('✓ Successfully replaced main action button to ✓ Finalizar');
} else {
  console.warn('! Could not find targetStr directly, searching substring...');
  const idx = content.indexOf("isFutureDay ? 'Concluir Jogo' : 'Finalizar / Receber Bola'");
  if (idx !== -1) {
    const startSpan = content.lastIndexOf('<span class="btn-ball-icon"', idx);
    const endSpan = content.indexOf('</span>', idx) + 7;
    console.log('Replacing span from', startSpan, 'to', endSpan);
    content = content.slice(0, startSpan) + replacementStr + content.slice(endSpan);
    console.log('✓ Replaced via substring indexes');
  }
}

fs.writeFileSync('public/admin.html', content, 'utf8');
console.log('✓ Saved public/admin.html');
