const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');

const targets = [
  'Finalizar / Receber Bola',
  'Concluir / Receber Bola',
  'Receber bola',
  'receber a bola',
  'Bola Recebida',
  'Bola recebida',
  'Bola Devolvida',
  'recebimento da bola'
];

targets.forEach(t => {
  const matches = [...content.matchAll(new RegExp(t, 'gi'))];
  console.log(`Target '${t}': found ${matches.length} matches`);
  matches.forEach(m => {
    console.log(`  idx ${m.index}: ${content.slice(Math.max(0, m.index - 40), m.index + t.length + 40).replace(/\n/g, ' ')}`);
  });
});
