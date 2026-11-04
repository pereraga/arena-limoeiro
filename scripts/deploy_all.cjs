const { execSync } = require('child_process');
const path = require('path');

const cwd = path.join(__dirname, '..');

console.log('1. Git Add & Commit...');
execSync('git add public/ supabase/ scripts/', { cwd, stdio: 'inherit' });
try {
  execSync('git commit -m "feat: resetar entrada indevida dos jogos do dia 04 deixando-os confirmados e prontos para iniciar o jogo"', { cwd, stdio: 'inherit' });
} catch(e) {
  console.log('No new commit needed or already committed.');
}

console.log('2. Git Push...');
try {
  execSync('git push origin main', { cwd, stdio: 'inherit' });
  console.log('✓ Git push origin main complete!');
} catch(e) {
  console.warn('Git push note:', e.message);
}

console.log('3. Vercel Production Deploy Check...');
