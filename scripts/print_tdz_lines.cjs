const fs = require('fs');

const content = fs.readFileSync('public/index-sistema2.html', 'utf8');

const scriptTag = content.indexOf('<script>');
const scriptEnd = content.indexOf('</script>', scriptTag);
const code = content.slice(scriptTag + 8, scriptEnd);

const lines = code.split('\n');
console.log('Lines 270 to 300:');
for (let i = 265; i < Math.min(310, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

console.log('Lines 400 to 420:');
for (let i = 400; i < Math.min(425, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
