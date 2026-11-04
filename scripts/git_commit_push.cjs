const { execSync } = require('child_process');

try {
  console.log('Running git add...');
  execSync('git add api/ public/ scripts/ server.js', { stdio: 'inherit' });

  console.log('Running git commit...');
  execSync('git commit -m "fix: geracao de novo qr code whatsapp, endpoint disconnect e verificacao de upload e sync em nuvem"', { stdio: 'inherit' });

  console.log('Running git push...');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('Push complete!');
} catch (err) {
  console.error('Git error:', err.message);
  process.exit(1);
}
