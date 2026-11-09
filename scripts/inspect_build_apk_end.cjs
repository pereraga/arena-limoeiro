const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, '..');
const scriptPath = path.join(projectDir, 'scripts', 'build_both_apks.cjs');
console.log(fs.readFileSync(scriptPath, 'utf8').substring(2800, 6000));
