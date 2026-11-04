const { execSync } = require('child_process');

try {
  console.log('Running git add...');
  execSync('git add public/ scripts/', { stdio: 'inherit' });

  console.log('Running git commit...');
  execSync('git commit -m "feat: ocultar horarios indisponiveis, card de jogos agendados com pessoa e limite de horario no balcao"', { stdio: 'inherit' });

  console.log('Running git push...');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('Push complete!');
} catch (err) {
  console.error('Git error:', err.message);
  process.exit(1);
}
