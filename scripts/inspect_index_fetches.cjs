const fs = require('fs');
const content = fs.readFileSync('public/index.html', 'utf8');

console.log('index.html size:', content.length);
// Search for fetch or supabase in index.html
const fetchRegex = /fetch\s*\(([^)]+)\)/g;
let m;
let count = 0;
while ((m = fetchRegex.exec(content)) !== null) {
  count++;
  console.log(`Fetch #${count}: ${m[0].substring(0, 100)}`);
}
console.log('Total fetches in index.html:', count);

// Search for ARENA_CLOUD or db2Url or db1Url
const dbsIdx = content.indexOf('ARENA_CLOUD');
console.log('ARENA_CLOUD in index.html:', dbsIdx);
if (dbsIdx !== -1) {
  console.log(content.substring(dbsIdx, dbsIdx + 300));
}
