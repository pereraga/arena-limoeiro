const fs = require('fs');

const content = fs.readFileSync('C:/Users/PC/Downloads/index (1).html', 'utf8');
const scriptStart = content.indexOf('<script>');
const scriptEnd = content.lastIndexOf('</script>');

console.log('--- ENTIRE SCRIPT OF index (1).html ---');
console.log(content.slice(scriptStart + 8, scriptEnd));
