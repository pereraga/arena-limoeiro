const { execSync } = require('child_process');

try {
  console.log('Staging files...');
  execSync('git add public/ scripts/', { stdio: 'inherit' });

  console.log('Committing...');
  execSync('git commit -m "fix(mobile): prevent auto-scroll jumps on mobile by replacing scrollIntoView with safe container-only scroll"', { stdio: 'inherit' });

  console.log('Pushing to GitHub...');
  execSync('git push origin main', { stdio: 'inherit' });

  console.log('Git push finished successfully!');
} catch (err) {
  console.error('Git operation error:', err.message);
  process.exit(1);
}
