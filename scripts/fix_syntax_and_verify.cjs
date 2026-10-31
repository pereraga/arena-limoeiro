const fs = require('fs');
const vm = require('vm');

const filePath = 'public/index-sistema2.html';
let content = fs.readFileSync(filePath, 'utf8');

// Fix line 584:
content = content.replace(
  '`🔑 *Código de Verificação:* `${bookingId}`\\n`',
  '`🔑 *Código de Verificação:* \\`${bookingId}\\`\\n`'
);

fs.writeFileSync(filePath, content, 'utf8');

// Now re-verify syntax
const scriptTag = content.indexOf('<script>');
const scriptEnd = content.indexOf('</script>', scriptTag);
const code = content.slice(scriptTag + 8, scriptEnd);

try {
  new vm.Script(code, { filename: 'index-sistema2-script.js' });
  console.log('🎉 Syntax check PASSED! No compilation errors!');
} catch (err) {
  console.error('Still has compilation error:');
  console.error(err.stack);
}
