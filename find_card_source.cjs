const fs = require('fs');

const d = fs.readFileSync('public/default-data.js', 'utf8');
const pos = d.indexOf('pago_balcao');
console.log('pago_balcao in default-data.js:', pos);
if (pos !== -1) {
  console.log(d.slice(pos - 100, pos + 250));
}

const pos2 = d.indexOf('Jogo 3/24');
console.log('Jogo 3/24 in default-data.js:', pos2);
if (pos2 !== -1) {
  console.log(d.slice(pos2 - 100, pos2 + 250));
}
