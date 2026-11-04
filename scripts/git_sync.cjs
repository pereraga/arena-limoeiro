const { execSync } = require('child_process');

try {
  execSync('git add package.json server.js supabase/ scripts/ public/', { stdio: 'inherit' });
  execSync('git commit -m "feat: implementar protocolo autonomo de ciberseguranca RLS headers e conclusao de jogos"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✓ Git commit & push successful!');
} catch (e) {
  console.error('Git sync error:', e.message);
  process.exit(1);
}
