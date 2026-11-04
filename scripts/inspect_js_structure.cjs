const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

// Let's search for functions in the script tags
const scriptBlocks = [];
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let m;
let sIdx = 0;
while ((m = scriptRegex.exec(content)) !== null) {
  sIdx++;
  const srcMatch = m[0].match(/src="([^"]+)"/);
  console.log(`Script #${sIdx}: ${srcMatch ? 'External: ' + srcMatch[1] : 'Inline (' + m[1].length + ' bytes)'}`);
}

// Let's search where courtState, modalities, monthly, etc are defined in inline scripts
const terms = ['courtState', 'switchCadastrosSubTab', 'renderCadastrosSubTab', 'subtab-jogos', 'subtab-mensalistas', 'subtab-clientes', 'exportBackup', 'importBackup'];
terms.forEach(t => {
  const pos = content.indexOf(t);
  console.log(`\nTerm '${t}': found at pos ${pos}`);
  if (pos !== -1) {
    console.log(content.substring(pos, pos + 300));
  }
});
