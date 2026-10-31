const fs = require('fs');

// 1. Atualizar public/app.js
let appJs = fs.readFileSync('public/app.js', 'utf8');

// Converte URLs do Google Drive para o link direto de imagem final (lh3)
appJs = appJs.replace(
  "return 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1200';",
  "return 'https://lh3.googleusercontent.com/d/' + fileId + '=w1200';"
);

// Adiciona referrerpolicy='no-referrer' em todas as tags <img> de quadras no modal da galeria
appJs = appJs.replace(
  '<img src="${imgUrl}" onerror="if(!this.dataset.errored){this.dataset.errored=\'1\';console.warn(\'Falha imagem:\',this.src);}" class="w-full h-full object-cover">',
  '<img src="${imgUrl}" referrerpolicy="no-referrer" onerror="if(!this.dataset.errored){this.dataset.errored=\'1\';console.warn(\'Falha imagem:\',this.src);}" class="w-full h-full object-cover">'
);

// Adiciona referrerpolicy='no-referrer' no carrossel de quadras principal
appJs = appJs.replace(
  '<img id="court-img-${court.id}" src="${currentActiveImage}" alt="${court.name}"',
  '<img id="court-img-${court.id}" referrerpolicy="no-referrer" src="${currentActiveImage}" alt="${court.name}"'
);

fs.writeFileSync('public/app.js', appJs, 'utf8');

// 2. Atualizar public/index.html e public/default-data.js
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace(
  'https://drive.google.com/thumbnail?id=1KA-WEG8J4q6UtUXKyVzSyRha_PgwtHCD&sz=w1200',
  'https://lh3.googleusercontent.com/d/1KA-WEG8J4q6UtUXKyVzSyRha_PgwtHCD=w1200'
);
html = html.replace(
  '<img id="court-img-court-society-1" src="https://lh3.googleusercontent.com/d/1KA-WEG8J4q6UtUXKyVzSyRha_PgwtHCD=w1200"',
  '<img id="court-img-court-society-1" referrerpolicy="no-referrer" src="https://lh3.googleusercontent.com/d/1KA-WEG8J4q6UtUXKyVzSyRha_PgwtHCD=w1200"'
);
fs.writeFileSync('public/index.html', html, 'utf8');

let def = fs.readFileSync('public/default-data.js', 'utf8');
def = def.replace(
  'https://drive.google.com/thumbnail?id=1KA-WEG8J4q6UtUXKyVzSyRha_PgwtHCD&sz=w1200',
  'https://lh3.googleusercontent.com/d/1KA-WEG8J4q6UtUXKyVzSyRha_PgwtHCD=w1200'
);
fs.writeFileSync('public/default-data.js', def, 'utf8');

console.log('Arquivos atualizados com sucesso para lh3.googleusercontent.com e referrerpolicy no-referrer!');
