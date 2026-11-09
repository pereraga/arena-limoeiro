const { execSync } = require('child_process');

try {
  console.log('Running git add...');
  execSync('git add -A', { stdio: 'inherit' });

  console.log('Running git commit...');
  execSync('git commit -m "fix: dateStr scope in toggleBalcaoTimeSlot to compute hours and price"', { stdio: 'inherit' });

  console.log('Running git push...');
  execSync('git push origin main', { stdio: 'inherit' });

  console.log('Git operations completed successfully!');
} catch (e) {
  console.error('Error during git execution:', e.message);
  process.exit(1);
}
