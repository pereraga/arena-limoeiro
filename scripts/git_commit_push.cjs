const { execSync } = require('child_process');

try {
  console.log('Running git add...');
  execSync('git add api/ public/ scripts/', { stdio: 'inherit' });

  console.log('Running git commit...');
  execSync('git commit -m "fix: qr code whatsapp fixo com carregamento instantaneo sem travar no spinner"', { stdio: 'inherit' });

  console.log('Running git push...');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('Push complete!');
} catch (err) {
  console.error('Git error:', err.message);
  process.exit(1);
}
