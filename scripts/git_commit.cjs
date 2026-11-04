const { execSync } = require('child_process');
const path = require('path');

const cwd = path.join(__dirname, '..');
execSync('git add public/', { cwd, stdio: 'inherit' });
execSync('git commit -m "fix: isolamento estrito de datas e prevencao de contaminacao de jogos entre dias"', { cwd, stdio: 'inherit' });
console.log('✓ Committed successfully');
