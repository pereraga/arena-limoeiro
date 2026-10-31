const fs = require('fs');

const content = fs.readFileSync('public/index-sistema2.html', 'utf8');

const scriptTag = content.indexOf('<script>');
const scriptEnd = content.indexOf('</script>', scriptTag);
const code = content.slice(scriptTag + 8, scriptEnd);

const lines = code.split('\n');
console.log('Lines 570 to 600:');
for (let i = 569; i < Math.min(610, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
