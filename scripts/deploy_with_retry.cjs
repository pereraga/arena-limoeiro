const { execSync } = require('child_process');

for (let attempt = 1; attempt <= 5; attempt++) {
  console.log(`\n--- Vercel Deploy Attempt ${attempt}/5 ---`);
  try {
    const output = execSync('npx vercel --prod --yes', {
      encoding: 'utf8',
      timeout: 120000
    });
    console.log('Deploy succeeded!');
    console.log(output);
    process.exit(0);
  } catch (err) {
    console.warn(`Attempt ${attempt} failed:`, err.message || err.stdout);
    if (attempt < 5) {
      console.log('Waiting 3 seconds before next retry...');
      const start = Date.now();
      while (Date.now() - start < 3000) {}
    }
  }
}

console.error('All deploy attempts failed.');
process.exit(1);
