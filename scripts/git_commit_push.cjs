const { execSync } = require('child_process');

try {
  console.log('Running git add...');
  execSync('git add public/ scripts/', { stdio: 'inherit' });

  console.log('Running git commit...');
  execSync('git commit -m "feat: integracao whatsapp qr code e envio de otp na aba api para confirmacao de conta de clientes novos"', { stdio: 'inherit' });

  console.log('Running git push...');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('Push complete!');
} catch (err) {
  console.error('Git error:', err.message);
  process.exit(1);
}
