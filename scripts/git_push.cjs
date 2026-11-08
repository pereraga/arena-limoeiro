const { execSync } = require('child_process');
const cwd = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';

const commitMsg = process.argv[2] || 'fix: eliminate static 03/11 flash on boot with synchronous dynamic today date rendering';

console.log('Staging changes...');
execSync('git add -A', { cwd, stdio: 'inherit' });

console.log('Committing changes...');
execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { cwd, stdio: 'inherit' });

console.log('Pushing to origin main...');
execSync('git push origin main', { cwd, stdio: 'inherit' });

console.log('Done!');
