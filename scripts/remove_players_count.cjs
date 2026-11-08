const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../public/admin.html');
let content = fs.readFileSync(adminPath, 'utf8');

console.log('[Script] Removendo exibição de "jogadores previstos" dos cards de agendamento...');

const targetSnippet = `                <span class="flex items-center gap-1.5 font-medium text-slate-700">
                  <i class="fa-solid fa-users text-slate-400"></i> \${playersCount} jogadores previstos
                </span>`;

if (content.includes(targetSnippet)) {
  content = content.replace(targetSnippet, '');
  fs.writeFileSync(adminPath, content, 'utf8');
  console.log('✓ Removido com sucesso de public/admin.html!');
} else {
  // Tenta substituição alternativa considerando quebras de linha
  const regex = /<span class="flex items-center gap-1\.5 font-medium text-slate-700">\s*<i class="fa-solid fa-users text-slate-400"><\/i>\s*\$\{playersCount\}\s*jogadores previstos\s*<\/span>\s*/g;
  if (regex.test(content)) {
    content = content.replace(regex, '');
    fs.writeFileSync(adminPath, content, 'utf8');
    console.log('✓ Removido via regex com sucesso de public/admin.html!');
  } else {
    console.error('! Snippet não encontrado.');
  }
}
