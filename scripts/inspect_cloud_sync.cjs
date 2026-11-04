const fs = require('fs');

const adminHtml = fs.readFileSync('public/admin.html', 'utf8');
const lines = adminHtml.split('\n');

console.log('--- Matches for pullDataFromCloudDatabases ---');
lines.forEach((line, i) => {
  if (line.includes('pullDataFromCloudDatabases')) {
    console.log(`${i+1}: ${line.trim()}`);
  }
});

console.log('\n--- Definition of pullDataFromCloudDatabases ---');
const idx = adminHtml.indexOf('window.pullDataFromCloudDatabases');
if (idx !== -1) {
  console.log(adminHtml.substring(idx - 50, idx + 1200));
} else {
  const idx2 = adminHtml.indexOf('pullDataFromCloudDatabases');
  if (idx2 !== -1) {
    console.log(adminHtml.substring(idx2 - 50, idx2 + 1200));
  }
}
