const fs = require('fs');

const content = fs.readFileSync('public/admin.html', 'utf8');
const idx = content.indexOf('const html = matches.map(m =>');
if (idx === -1) {
  const idx2 = content.indexOf('matches.map(m =>');
  console.log('Index matches.map:', idx2);
  if (idx2 !== -1) console.log(content.slice(idx2 - 100, idx2 + 400));
} else {
  console.log('Index const html = matches.map:', idx);
  console.log(content.slice(idx - 100, idx + 400));
}
