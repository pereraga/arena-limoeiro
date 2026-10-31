const fs = require('fs');

const userDriveImg = 'https://drive.google.com/thumbnail?id=1KA-WEG8J4q6UtUXKyVzSyRha_PgwtHCD&sz=w1200';

// 1. Atualizar index.html (SSR inicial da página)
let html = fs.readFileSync('public/index.html', 'utf8');
html = html.replace(/id="court-img-court-society-1" src="[^"]*"/, `id="court-img-court-society-1" src="${userDriveImg}"`);
fs.writeFileSync('public/index.html', html, 'utf8');

// 2. Atualizar default-data.js (dados offline de fábrica)
let defData = fs.readFileSync('public/default-data.js', 'utf8');
defData = defData.replace(/(id:\s*"court-society-1"[\s\S]*?image:\s*")[^"]*(")/, `$1${userDriveImg}$2`);
fs.writeFileSync('public/default-data.js', defData, 'utf8');

console.log('index.html e default-data.js atualizados com a foto do FUT 5!');
