const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

console.log('admin.html size:', content.length);

// Search for scroll, scrollTo, scrollIntoView, focus
const scrollPatterns = ['scrollIntoView', 'scrollTo', 'scrollBy', 'scrollTop', 'window.scroll'];
scrollPatterns.forEach(pat => {
  const matches = [...content.matchAll(new RegExp(pat, 'g'))];
  console.log(`Pattern "${pat}": count = ${matches.length}`);
});

let p = 0;
while ((p = content.indexOf('scrollIntoView', p)) !== -1) {
  console.log('\n--- scrollIntoView at:', p);
  console.log(content.substring(Math.max(0, p - 100), Math.min(content.length, p + 200)));
  p += 'scrollIntoView'.length;
}
