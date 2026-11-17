const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// 1. No HTML, adicionar style="display:none;" por padrão no balcaoScheduledGamesContainer
html = html.replace(
  '<div id="balcaoScheduledGamesContainer" class="p-1.5 bg-rose-50/90 border border-rose-200 rounded-lg space-y-0.5 text-[9.5px]">',
  '<div id="balcaoScheduledGamesContainer" style="display:none;" class="p-1.5 bg-rose-50/90 border border-rose-200 rounded-lg space-y-0.5 text-[9.5px]">'
);

// 2. No JavaScript renderBalcaoTimeSlots, capturar o container e ocultar se occupiedRanges.length === 0
const oldJs = `    // Atualiza o Card Informativo de Jogos Agendados
    if (gamesListEl) {
      if (occupiedRanges.length === 0) {
        gamesListEl.innerHTML = '<span class="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">✨ Nenhum jogo agendado nesta quadra neste dia. Todos os horários estão livres!</span>';
        if (gamesCountEl) gamesCountEl.textContent = '0 agendados';
      } else {
        if (gamesCountEl) gamesCountEl.textContent = occupiedRanges.length + (occupiedRanges.length === 1 ? ' agendado' : ' agendados');
        let listHtml = '';
        occupiedRanges.forEach(g => {
          listHtml += '<span class="inline-flex items-center gap-1 bg-amber-100/90 text-amber-950 font-extrabold px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs">';
          listHtml += '🕒 ' + g.startStr + ' às ' + g.endStr + ' — <strong class="text-amber-900">' + g.name + '</strong> (' + g.type + ')';
          listHtml += '</span>';
        });
        gamesListEl.innerHTML = listHtml;
      }
    }`;

const newJs = `    // Atualiza o Card Informativo de Jogos Agendados
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
    }`;

html = html.replace(oldJs, newJs);

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Successfully hid balcaoScheduledGamesContainer when 0 occupied games!');
