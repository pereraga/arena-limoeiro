const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../public/admin.html');
let html = fs.readFileSync(targetPath, 'utf8');

// Ocultar o bloco do seletor "Espaço: Todas as Quadras e Campos" mantendo o elemento no DOM para compatibilidade com o JS das pílulas
const targetBlock = `          <!-- Filtro Status / Seletor de Quadras & Campos -->
          <div class="flex items-center gap-2 w-full sm:w-auto flex-1 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 sm:py-1.5 transition shadow-2xs">
            <span class="text-[11px] sm:text-xs font-black uppercase text-slate-700 shrink-0 flex items-center gap-1 min-w-[65px]">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600"></i> Espaço:
            </span>
            <div class="relative flex-1 min-w-[140px]">
              <select id="movementCourtFilter" onchange="filterMovementMatches()" class="w-full py-1.5 sm:py-2 pl-2 pr-7 border-0 rounded-lg text-xs font-bold text-slate-800 bg-transparent focus:ring-2 focus:ring-emerald-600 truncate appearance-none cursor-pointer">
                <option value="all">🏟️ Todas as Quadras e Campos</option>
                <option value="fut5">⚽ FUT 5 – SOCCER 5</option>
                <option value="fut6">⚽ FUT 6 – SOCCER 6</option>
                <option value="fut7">⚽ FUT 7 – SOCCER 7</option>
                <option value="futmesa">🎯 FOOT TABLE – FUTMESA</option>
                <option value="areia">🏖️ AREIA – BEACH SPORTS</option>
                <option value="society">🏟️ QUADRA – ARENA CENTRAL</option>
              </select>
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            </div>
          </div>`;

const replacementBlock = `          <!-- Filtro / Seletor de Espaço (Ocultado visualmente conforme solicitação: seleção realizada via pílulas de quadra) -->
          <div style="display:none !important;">
            <select id="movementCourtFilter" onchange="filterMovementMatches()">
              <option value="all">🏟️ Todas as Quadras e Campos</option>
              <option value="fut5">⚽ FUT 5 – SOCCER 5</option>
              <option value="fut6">⚽ FUT 6 – SOCCER 6</option>
              <option value="fut7">⚽ FUT 7 – SOCCER 7</option>
              <option value="futmesa">🎯 FOOT TABLE – FUTMESA</option>
              <option value="areia">🏖️ AREIA – BEACH SPORTS</option>
              <option value="society">🏟️ QUADRA – ARENA CENTRAL</option>
            </select>
          </div>`;

if (!html.includes(targetBlock)) {
  console.error('Target block not found!');
  process.exit(1);
}

html = html.replace(targetBlock, replacementBlock);
fs.writeFileSync(targetPath, html, 'utf8');
console.log('Successfully removed Espaço button from movement view!');
