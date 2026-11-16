const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const target1Sub = 'Evita duplicatas se já existe registro com o MESMO ID';
console.log('target1Sub in content:', content.includes(target1Sub));

const target2Sub = 'Se o jogo editado for um Mensalista Fixo, sincroniza também em monthly_members';
console.log('target2Sub in content:', content.includes(target2Sub));
