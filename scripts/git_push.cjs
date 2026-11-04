const { execSync } = require('child_process');
const path = require('path');

const cwd = path.join(__dirname, '..');
try {
  console.log('Pushing to origin...');
  execSync('git push origin main', { cwd, stdio: 'inherit' });
  console.log('✓ Pushed to origin');
} catch(e) {
  console.warn('Origin push note:', e.message);
}

try {
  console.log('Pushing to second remote if any...');
  const remotes = execSync('git remote', { cwd }).toString().trim().split('\n');
  console.log('Remotes:', remotes);
  remotes.forEach(r => {
    r = r.trim();
    if (r && r !== 'origin') {
      try {
        execSync(`git push ${r} main`, { cwd, stdio: 'inherit' });
        console.log(`✓ Pushed to ${r}`);
      } catch(er) {
        console.warn(`Push to ${r} note:`, er.message);
      }
    }
  });
} catch(e) {}
