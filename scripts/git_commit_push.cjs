const { execSync } = require('child_process');

try {
  console.log('Running git add...');
  execSync('git add public/ scripts/', { stdio: 'inherit' });

  console.log('Running git commit...');
  execSync('git commit -m "feat: janelas visuais de horarios de 30 em 30 min na reserva de balcao com deteccao de ocupados e voltar selecao"', { stdio: 'inherit' });

  console.log('Running git push...');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('Push complete!');
} catch (err) {
  console.error('Git error:', err.message);
  process.exit(1);
}
