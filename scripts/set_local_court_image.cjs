const fs = require('fs');

// 1. Atualiza public/index.html
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace(
  'id="court-img-court-society-1" referrerpolicy="no-referrer" src="https://lh3.googleusercontent.com/d/1KA-WEG8J4q6UtUXKyVzSyRha_PgwtHCD=w1200"',
  'id="court-img-court-society-1" src="/img-fut5.jpg"'
);
fs.writeFileSync('public/index.html', html, 'utf8');

// 2. Atualiza public/default-data.js
let def = fs.readFileSync('public/default-data.js', 'utf8');
def = def.replace(
  'image: "https://lh3.googleusercontent.com/d/1KA-WEG8J4q6UtUXKyVzSyRha_PgwtHCD=w1200"',
  'image: "/img-fut5.jpg"'
);
def = def.replace(
  `gallery: [
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80"
      ]`,
  `gallery: [
        "/img-fut5.jpg"
      ]`
);
fs.writeFileSync('public/default-data.js', def, 'utf8');

console.log('Arquivos atualizados com /img-fut5.jpg!');
