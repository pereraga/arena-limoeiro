const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');

const regex = /toggleDetails/gi;
let m;
while ((m = regex.exec(content)) !== null) {
  console.log('Match at', m.index);
  console.log(content.slice(Math.max(0, m.index - 50), m.index + 400));
}
