const fs = require('fs');

const content = fs.readFileSync('C:/Users/PC/Downloads/arena_limoeiro_painel_financeiro_inteligente.html', 'utf8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);

const fnMatches = content.match(/function\s+([a-zA-Z0-9_]+)/g);
console.log('Functions found:', fnMatches ? [...new Set(fnMatches)] : 'none');

const idMatches = content.match(/id=["']([^"']+)["']/g);
console.log('IDs found:', idMatches ? [...new Set(idMatches)].slice(0, 30) : 'none');

// Find script tags
const scriptStarts = [];
lines.forEach((l, idx) => {
  if (l.includes('<script')) scriptStarts.push(idx);
});
console.log('Script starts at lines:', scriptStarts);
