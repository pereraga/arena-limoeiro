const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

// Target tab-btn CSS
const targetCss = `    /* ESTILO DOS BOTÕES DE ABA: PREENCHENDO A TELA POR COMPLETO (1 LINHA SE GRANDE, 2 LINHAS SE NECESSÁRIO) */
    .tab-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.55rem 0.95rem;
      border-radius: 9999px !important;
      font-size: 0.8125rem;
      font-weight: 700;
      white-space: nowrap;
      height: 42px;
      box-sizing: border-box;
      transition: all 0.16s ease-in-out;
      cursor: pointer;
      user-select: none;
      flex: 1 1 auto;
      min-width: 120px;
    }`;

const replacementCss = `    /* ESTILO DOS BOTÕES DE ABA: PREENCHENDO A TELA POR COMPLETO (1 LINHA SE GRANDE, 2 LINHAS SE NECESSÁRIO) */
    .tab-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.55rem 0.95rem;
      border-radius: 9999px !important;
      font-size: 0.8125rem;
      font-weight: 700;
      white-space: nowrap;
      height: 42px;
      box-sizing: border-box;
      transition: all 0.16s ease-in-out;
      cursor: pointer;
      user-select: none;
      flex: 1 1 auto;
      min-width: max-content;
    }`;

if (content.includes(targetCss)) {
  content = content.replace(targetCss, replacementCss);
  fs.writeFileSync(adminPath, content, 'utf8');
  console.log('CSS tab-btn min-width updated to max-content!');
} else {
  console.error('targetCss not found!');
}
