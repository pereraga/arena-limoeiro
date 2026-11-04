const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const start = content.indexOf('id="panel-cadastros"');
const end = content.indexOf('</section>', start);
console.log('panel-cadastros bounds:', start, end);
const sectionHtml = content.substring(start, end + 10);
console.log('Section HTML length:', sectionHtml.length);

// Find buttons inside panel-cadastros
const btnRegex = /<button[\s\S]*?<\/button>/gi;
let m;
const buttons = [];
while ((m = btnRegex.exec(sectionHtml)) !== null) {
  const onclick = m[0].match(/onclick="([^"]+)"/);
  const text = m[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  buttons.push({ text, onclick: onclick ? onclick[1] : 'none' });
}
console.log('Buttons inside panel-cadastros:', buttons);
