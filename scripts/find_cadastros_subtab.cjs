const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const regex = /switchCadastrosSubTab/g;
let m;
while ((m = regex.exec(content)) !== null) {
  const lineNum = content.substring(0, m.index).split('\n').length;
  console.log(`Line ${lineNum}: ${content.substring(m.index - 30, m.index + 80).replace(/\n/g, ' ')}`);
}
