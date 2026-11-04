const fs = require('fs');
const path = require('path');
const vm = require('vm');

const adminPath = path.join(__dirname, '..', 'public', 'admin.html');
const content = fs.readFileSync(adminPath, 'utf8');

// Extract all <script> blocks that don't have src
const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  const code = match[1];
  try {
    new vm.Script(code);
    console.log(`Script block #${count} syntax valid.`);
  } catch (err) {
    console.error(`Syntax error in script block #${count}:`, err.message);
    process.exit(1);
  }
}

console.log(`All ${count} script blocks in admin.html are syntactically valid!`);
