const fs = require('fs');
const path = require('path');
const vm = require('vm');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Extract all <script>...</script> tags
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 0;

while ((match = scriptRegex.exec(content)) !== null) {
  scriptIndex++;
  const scriptCode = match[1];
  if (!scriptCode.trim()) continue;
  try {
    new vm.Script(scriptCode, { filename: `script_${scriptIndex}.js` });
    console.log(`Script ${scriptIndex}: SYNTAX OK (length: ${scriptCode.length})`);
  } catch (err) {
    console.error(`Script ${scriptIndex}: SYNTAX ERROR!`, err.message);
    console.error(`Line: ${err.stack}`);
  }
}
