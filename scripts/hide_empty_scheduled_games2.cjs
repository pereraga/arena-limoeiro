const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

const sIdx = html.indexOf('// Atualiza o Card Informativo de Jogos Agendados');
const eIdx = html.indexOf("let html = '';", sIdx);

const newBlock = `// Atualiza o Card Informativo de Jogos Agendados
    const gamesContainerEl = document.getElementById('balcaoScheduledGamesContainer');
    if (gamesContainerEl) {
      if (occupiedRanges.length === 0) {
        gamesContainerEl.style.display = 'none';
        if (gamesListEl) gamesListEl.innerHTML = '';
        if (gamesCountEl) gamesCountEl.textContent = '0 agendados';
      } else {
        gamesContainerEl.style.display = 'block';
        if (gamesCountEl) gamesCountEl.textContent = occupiedRanges.length + (occupiedRanges.length === 1 ? ' agendado' : ' agendados');
        if (gamesListEl) {
          let listHtml = '';
          occupiedRanges.forEach(g => {
            listHtml += '<span class="inline-flex items-center gap-1 bg-amber-100/90 text-amber-950 font-extrabold px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs">';
            listHtml += '🕒 ' + g.startStr + ' às ' + g.endStr + ' — <strong class="text-amber-900">' + g.name + '</strong> (' + g.type + ')';
            listHtml += '</span>';
          });
          gamesListEl.innerHTML = listHtml;
        }
      }
    }

    `;

html = html.slice(0, sIdx) + newBlock + html.slice(eIdx);
fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Successfully updated JavaScript logic to hide container when 0 games!');
