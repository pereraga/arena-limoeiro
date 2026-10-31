const fs = require('fs');

const content = fs.readFileSync('public/index-sistema2.html', 'utf8');

const scriptTag = content.indexOf('<script>');
const scriptEnd = content.indexOf('</script>', scriptTag);
const code = content.slice(scriptTag + 8, scriptEnd);

const lines = code.split('\n');
console.log('Total lines in script:', lines.length);

// Let's test lines progressively to find the exact line with syntax error
let accumulated = '';
for (let i = 0; i < lines.length; i++) {
  accumulated += lines[i] + '\n';
  try {
    new Function(accumulated);
  } catch (err) {
    if (!err.message.includes('Unexpected end of input') && 
        !err.message.includes('missing }') && 
        !err.message.includes('missing )') &&
        !err.message.includes('Unterminated') &&
        !err.message.includes('Unexpected token')) {
      console.log(`Line ${i + 1} caused error: ${err.message}`);
      console.log('Line content:', lines[i]);
      break;
    }
  }
}

// Also check any standalone '$' characters
lines.forEach((l, idx) => {
  if (l.includes('$') && !l.includes('${') && !l.includes('currency') && !l.includes('R$') && !l.includes('//')) {
    console.log(`Potential issue line ${idx + 1}: ${l}`);
  }
});
