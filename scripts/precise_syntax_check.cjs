const fs = require('fs');
const vm = require('vm');

const content = fs.readFileSync('public/index-sistema2.html', 'utf8');

const scriptTag = content.indexOf('<script>');
const scriptEnd = content.indexOf('</script>', scriptTag);
const code = content.slice(scriptTag + 8, scriptEnd);

try {
  new vm.Script(code, { filename: 'index-sistema2-script.js' });
} catch (err) {
  console.error('VM Compilation Error:');
  console.error(err.stack);
}
