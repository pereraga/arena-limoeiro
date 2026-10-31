const fs = require('fs');

const filePath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/index-sistema2.html';
let content = fs.readFileSync(filePath, 'utf8');

// Adiciona regras definitivas de desobstrução de cliques
const fixStyles = `
<style id="bulletproof-clicks">
  /* 1. Remove qualquer bloqueio fantasma de pseudo-elementos decorativos */
  .hero:before, .hero:after {
    pointer-events: none !important;
  }

  /* 2. Eleva o card e o formulário inteiro acima de qualquer outro elemento */
  .booking-wrap, .booking-card, #bookingForm {
    position: relative !important;
    z-index: 100 !important;
    pointer-events: auto !important;
  }

  /* 3. Garante que todos os campos de texto, data e números recebam foco imediato */
  input.control, select.control, input[type="date"], input[type="text"], input[type="tel"], #otpInput {
    pointer-events: auto !important;
    cursor: text !important;
    user-select: text !important;
    -webkit-user-select: text !important;
    background-color: #ffffff !important;
    position: relative !important;
    z-index: 101 !important;
  }

  /* 4. Garante que botões de quadra e horários respondam no primeiro toque/clique */
  .space-option, .time-btn, #btnSendCode, #btnValidateOtp, .submit-btn {
    pointer-events: auto !important;
    cursor: pointer !important;
    position: relative !important;
    z-index: 101 !important;
  }

  /* Impede que spans ou ícones internos bloqueiem o clique no botão pai */
  .space-option *, .time-btn *, #btnSendCode * {
    pointer-events: none !important;
  }
</style>
`;

content = content.replace('</head>', fixStyles + '\n</head>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Bulletproof click and field selection fix successfully applied to index-sistema2.html!');
