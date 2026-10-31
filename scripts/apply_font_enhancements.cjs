const fs = require('fs');
const filePath = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/index-sistema2.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Injetar Google Fonts com fontes modernas e super legíveis (Plus Jakarta Sans)
const googleFonts = '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n';

if (!content.includes('fonts.googleapis.com')) {
  content = content.replace('<head>', '<head>\n  ' + googleFonts);
}

// 2. Adicionar bloco de estilo para aumentar tamanhos, pesos, contrastes e nitidez
const customTypographyCSS = `
<style id="readability-enhancement">
  body {
    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    font-size: 15px !important;
    line-height: 1.6 !important;
    color: #0f172a !important;
    -webkit-font-smoothing: antialiased !important;
    -moz-osx-font-smoothing: grayscale !important;
  }
  
  /* Topbar e Navegação */
  .nav-links {
    font-size: 14px !important;
    font-weight: 700 !important;
  }
  .nav-cta {
    font-size: 13px !important;
    font-weight: 800 !important;
  }

  /* Cabeçalho do Card de Agendamento */
  .booking-head h2 {
    font-size: 26px !important;
    font-weight: 800 !important;
    color: #0f172a !important;
    letter-spacing: -0.02em !important;
  }
  .booking-head p {
    font-size: 15px !important;
    color: #475569 !important;
    font-weight: 500 !important;
  }
  .steps {
    font-size: 13px !important;
    font-weight: 700 !important;
  }
  .step b {
    width: 26px !important;
    height: 26px !important;
    font-size: 12px !important;
    font-weight: 800 !important;
  }

  /* Rótulos e Textos dos Campos */
  .field-label {
    font-size: 14px !important;
    font-weight: 800 !important;
    color: #0f172a !important;
    margin-bottom: 8px !important;
  }
  .field-label small {
    font-size: 12px !important;
    font-weight: 600 !important;
    color: #64748b !important;
  }

  /* Opções dos Espaços / Quadras */
  .space-name {
    font-size: 13px !important;
    font-weight: 800 !important;
    color: #0f172a !important;
    line-height: 1.3 !important;
  }
  .space-price {
    font-size: 12px !important;
    font-weight: 700 !important;
    color: #059669 !important;
    margin-top: 6px !important;
  }
  .space-option {
    padding: 14px 12px !important;
    border-width: 2px !important;
  }

  /* Inputs e Seletores */
  .control {
    font-size: 15px !important;
    font-weight: 600 !important;
    color: #0f172a !important;
    padding: 13px 14px !important;
    border: 1.5px solid #cbd5e1 !important;
  }
  .control::placeholder {
    color: #94a3b8 !important;
    font-weight: 400 !important;
  }

  /* Botões de Horários */
  .time-btn {
    font-size: 13px !important;
    font-weight: 800 !important;
    padding: 11px 6px !important;
    color: #1e293b !important;
    border: 1.5px solid #cbd5e1 !important;
  }
  .time-btn:disabled {
    font-size: 12px !important;
    font-weight: 600 !important;
    color: #94a3b8 !important;
    background: #f1f5f9 !important;
  }

  /* Rodapé do Agendamento / Resumo */
  .summary-item small {
    font-size: 11px !important;
    font-weight: 800 !important;
    letter-spacing: 0.08em !important;
    color: #64748b !important;
  }
  .summary-item strong {
    font-size: 17px !important;
    font-weight: 900 !important;
    color: #0f172a !important;
  }
  .summary-item .green {
    color: #059669 !important;
    font-size: 19px !important;
  }
  .submit-btn {
    font-size: 15px !important;
    font-weight: 800 !important;
    padding: 16px 24px !important;
    letter-spacing: 0.01em !important;
  }
  .fineprint {
    font-size: 12px !important;
    color: #64748b !important;
    line-height: 1.6 !important;
  }

  /* Cards inferiores dos Espaços */
  .space-card h3 {
    font-size: 18px !important;
    font-weight: 800 !important;
    color: #0f172a !important;
  }
  .space-card p {
    font-size: 13px !important;
    color: #475569 !important;
    line-height: 1.6 !important;
  }
  .card-price strong {
    font-size: 18px !important;
    font-weight: 800 !important;
    color: #0f172a !important;
  }
  .choose-btn {
    font-size: 12px !important;
    font-weight: 800 !important;
    padding: 10px 14px !important;
  }

  /* Seção Como Funciona */
  .how-item h3 {
    font-size: 16px !important;
    font-weight: 800 !important;
    color: #0f172a !important;
  }
  .how-item p {
    font-size: 13px !important;
    color: #475569 !important;
    line-height: 1.6 !important;
  }
</style>
`;

content = content.replace('</head>', customTypographyCSS + '\n</head>');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Typography and readability updated successfully in index-sistema2.html');
