const fs = require('fs');

const filePath = 'public/index-sistema2.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove the premature call to initEvents on lines 277-283
const prematureBlock = `  // Delegar eventos de clique diretamente no container de espaços para resposta 100% garantida
  document.addEventListener('DOMContentLoaded', () => {
    initEvents();
  });
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initEvents();
  }`;

if (content.includes(prematureBlock)) {
  content = content.replace(prematureBlock, '// initEvents will be called after all declarations');
  console.log('Removed premature initEvents call');
} else {
  console.log('Premature block not matched exactly, checking variants...');
}

// 2. Declare var _eventsInitialized = false; at the very top of script
const topScriptTarget = "let _sbClient = null;";
content = content.replace(topScriptTarget, "var _eventsInitialized = false;\n  let _sbClient = null;");

// 3. At the very end of the script, call initEvents properly
const endScriptTarget = `window.chooseSpace('fut5');
    setTimeout(() => { window.chooseSpace('fut5'); }, 100);
  }`;

const newEndScript = `
    // Inicializa todos os eventos após todas as funções estarem declaradas
    initEvents();
    window.chooseSpace('fut5');
  }`;

if (content.includes(endScriptTarget)) {
  content = content.replace(endScriptTarget, newEndScript);
  console.log('Updated end script to call initEvents and chooseSpace in order');
}

fs.writeFileSync(filePath, content, 'utf8');
