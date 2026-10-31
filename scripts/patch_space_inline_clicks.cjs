const fs = require('fs');

const filePath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/index-sistema2.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Colocar onclick direto nas tags HTML dos botões de quadra/espaço
const oldSpaceGrid = `<div class="space-grid" id="spaceOptions" role="group" aria-label="Escolha o espaço">
                <button type="button" class="space-option" data-space="fut5"><span class="space-icon">⚽</span><span class="space-name">FUT 5 · SOCCER 5</span><span class="space-price">R$ 90/h • promo R$ 50</span></button>
                <button type="button" class="space-option" data-space="fut6"><span class="space-icon">⚽</span><span class="space-name">FUT 6 · SOCCER 6</span><span class="space-price">R$ 100/h • promo R$ 60</span></button>
                <button type="button" class="space-option" data-space="fut7"><span class="space-icon">🏟️</span><span class="space-name">FUT 7 · SOCCER 7</span><span class="space-price">R$ 110/h • promo R$ 70</span></button>
                <button type="button" class="space-option" data-space="foot"><span class="space-icon">🎯</span><span class="space-name">FOOT TABLE · FUTMESA</span><span class="space-price">R$ 35/h • promo R$ 25</span></button>
                <button type="button" class="space-option" data-space="beach"><span class="space-icon">🏖️</span><span class="space-name">QUADRA DE AREIA</span><span class="space-price">R$ 50/h • promo R$ 30</span></button>
                <button type="button" class="space-option" data-space="society"><span class="space-icon">🥅</span><span class="space-name">QUADRA SOCIETY</span><span class="space-price">R$ 60/h • promo R$ 40</span></button>
              </div>`;

const newSpaceGrid = `<div class="space-grid" id="spaceOptions" role="group" aria-label="Escolha o espaço">
                <button type="button" class="space-option" data-space="fut5" onclick="chooseSpace('fut5')"><span class="space-icon">⚽</span><span class="space-name">FUT 5 · SOCCER 5</span><span class="space-price">R$ 90/h • promo R$ 50</span></button>
                <button type="button" class="space-option" data-space="fut6" onclick="chooseSpace('fut6')"><span class="space-icon">⚽</span><span class="space-name">FUT 6 · SOCCER 6</span><span class="space-price">R$ 100/h • promo R$ 60</span></button>
                <button type="button" class="space-option" data-space="fut7" onclick="chooseSpace('fut7')"><span class="space-icon">🏟️</span><span class="space-name">FUT 7 · SOCCER 7</span><span class="space-price">R$ 110/h • promo R$ 70</span></button>
                <button type="button" class="space-option" data-space="foot" onclick="chooseSpace('foot')"><span class="space-icon">🎯</span><span class="space-name">FOOT TABLE · FUTMESA</span><span class="space-price">R$ 35/h • promo R$ 25</span></button>
                <button type="button" class="space-option" data-space="beach" onclick="chooseSpace('beach')"><span class="space-icon">🏖️</span><span class="space-name">QUADRA DE AREIA</span><span class="space-price">R$ 50/h • promo R$ 30</span></button>
                <button type="button" class="space-option" data-space="society" onclick="chooseSpace('society')"><span class="space-icon">🥅</span><span class="space-name">QUADRA SOCIETY</span><span class="space-price">R$ 60/h • promo R$ 40</span></button>
              </div>`;

if (content.includes(oldSpaceGrid)) {
  content = content.replace(oldSpaceGrid, newSpaceGrid);
}

// 2. Colocar chooseSpace explicitamente em window.chooseSpace
const oldChooseDef = 'async function chooseSpace(id, scroll = false) {';
const newChooseDef = `window.chooseSpace = chooseSpace;
  async function chooseSpace(id, scroll = false) {`;

content = content.replace(oldChooseDef, newChooseDef);

// 3. Garantir que no final do script ele execute chooseSpace imediatamente
const oldInitTarget = "chooseSpace('fut5');";
const newInitTarget = `window.chooseSpace('fut5');
    setTimeout(() => { window.chooseSpace('fut5'); }, 100);`;

content = content.replace(oldInitTarget, newInitTarget);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Inline onclick and global window.chooseSpace successfully installed!');
