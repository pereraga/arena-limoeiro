const fs = require('fs');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');

const regex = /openFinishGame/gi;
let m;
while ((m = regex.exec(adminHtml)) !== null) {
  console.log('Match at', m.index);
  console.log(adminHtml.slice(Math.max(0, m.index - 50), m.index + 350));
}
