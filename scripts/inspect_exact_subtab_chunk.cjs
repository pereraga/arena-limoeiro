const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const idx = content.indexOf('<!-- Horários Fixos (40) -->');
const idxEnd = content.indexOf('<!-- Linha 2 de sub-abas', idx);
const idxEnd2 = content.indexOf('</div>', idxEnd + 50);
console.log('idx:', idx, 'idxEnd:', idxEnd, 'idxEnd2:', idxEnd2);
console.log(content.substring(idx, idxEnd2 + 6));
