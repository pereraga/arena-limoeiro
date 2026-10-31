const fs = require('fs');

const filePath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/index-sistema2.html';
let content = fs.readFileSync(filePath, 'utf8');

// Adicionar regra explícita de alto contraste com !important para o botão selecionado
const selectedBtnStyle = `
  /* Botão de Horário Selecionado - Super Legível e Nítido */
  .time-btn.selected {
    background: #0f172a !important; /* Fundo escuro elegante */
    color: #ffffff !important;      /* Texto 100% branco nítido */
    font-weight: 900 !important;
    font-size: 13.5px !important;
    border-color: #0e9655 !important; /* Destaque verde esmeralda */
    box-shadow: 0 0 0 2px #0e9655, 0 4px 10px rgba(14, 150, 85, 0.25) !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
  }
`;

content = content.replace('/* Horários */', '/* Horários */\n' + selectedBtnStyle);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Selected time button style updated with pure white text and crisp contrast!');
