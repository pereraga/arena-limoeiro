const { execSync } = require('child_process');
const cwd = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';

console.log('Staging changes...');
execSync('git add -A', { cwd, stdio: 'inherit' });

console.log('Committing changes...');
execSync('git commit -m "feat: auto-expire matches with avulso cancellation and mensalista monthly billing"', { cwd, stdio: 'inherit' });

console.log('Pushing to origin main...');
execSync('git push origin main', { cwd, stdio: 'inherit' });

console.log('Done!');
