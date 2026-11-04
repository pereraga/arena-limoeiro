const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');

const regex = /Iniciar/gi;
let m;
const occurrences = [];
while ((m = regex.exec(content)) !== null) {
  occurrences.push({
    index: m.index,
    snippet: content.slice(Math.max(0, m.index - 50), m.index + 100).replace(/\n/g, ' ')
  });
}

console.log('Occurrences of Iniciar:', occurrences.length);
occurrences.forEach((o, i) => console.log(`[${i+1}] (idx: ${o.index}): ${o.snippet}`));
