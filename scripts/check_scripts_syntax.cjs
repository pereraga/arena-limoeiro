const fs = require('fs');

const content = fs.readFileSync('public/index-sistema2.html', 'utf8');

// Find all script tags
let pos = 0;
let count = 0;
while (true) {
  const start = content.indexOf('<script', pos);
  if (start === -1) break;
  const tagEnd = content.indexOf('>', start);
  const end = content.indexOf('</script>', tagEnd);
  if (end === -1) break;
  
  const tagOpen = content.slice(start, tagEnd + 1);
  const code = content.slice(tagEnd + 1, end);
  count++;
  console.log(`\n--- Script #${count} (${tagOpen}) Length: ${code.length} ---`);
  if (code.trim()) {
    try {
      new Function(code);
      console.log('Syntax: OK');
    } catch (e) {
      console.error('SYNTAX ERROR:', e.message);
      // print first 500 chars of code
      console.log(code.slice(0, 500));
    }
  } else {
    console.log('Empty / external');
  }
  pos = end + 9;
}
