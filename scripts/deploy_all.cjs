const { execSync } = require('child_process');
const path = require('path');

const cwd = path.join(__dirname, '..');

console.log('1. Git Add & Commit...');
execSync('git add public/ supabase/ scripts/', { cwd, stdio: 'inherit' });
try {
  execSync('git commit -m "feat: adicionar filtros rapidos e visibilidade de jogos finalizados do dia com RLS e Cloud Sync"', { cwd, stdio: 'inherit' });
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

console.log('3. Vercel Production Deploy...');
try {
  const out = execSync('npx vercel --prod --yes', { cwd, stdio: 'pipe' });
  console.log(out.toString());
} catch(e) {
  console.error('Vercel deploy output:', e.stdout ? e.stdout.toString() : e.message);
}
