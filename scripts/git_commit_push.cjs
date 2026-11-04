const { execSync } = require('child_process');

try {
  console.log('Running git add...');
  execSync('git add api/ public/ scripts/ server.js', { stdio: 'inherit' });

  console.log('Running git commit...');
  execSync('git commit -m "feat: suporte e simulador de codigo de 4 digitos otp para confirmacao de conta de novos clientes"', { stdio: 'inherit' });

  console.log('Running git push...');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('Push complete!');
} catch (err) {
  console.error('Git error:', err.message);
  process.exit(1);
}
