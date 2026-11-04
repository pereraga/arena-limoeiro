const { execSync } = require('child_process');

try {
  console.log('Running git add...');
  execSync('git add public/ scripts/', { stdio: 'inherit' });

  console.log('Running git commit...');
  execSync('git commit -m "feat: padronizar layout operacional de todos os cartoes de jogos com novo design, controles operacionais e timeline"', { stdio: 'inherit' });

  console.log('Running git push...');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('Push complete!');
} catch (err) {
  console.error('Git error:', err.message);
  process.exit(1);
}
