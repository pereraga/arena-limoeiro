const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

function searchCode(title, pattern, maxLen = 600) {
  console.log(`\n=================== ${title} ===================`);
  let idx = 0;
  let count = 0;
  while ((idx = content.indexOf(pattern, idx)) !== -1) {
    count++;
    console.log(`--- Match #${count} at char ${idx} ---`);
    console.log(content.substring(Math.max(0, idx - 50), Math.min(content.length, idx + maxLen)));
    idx += pattern.length;
    if (count >= 5) break;
  }
  if (count === 0) console.log('No matches found.');
}

searchCode('panel-courts code', 'panel-courts');
searchCode('panel-modalities code', 'panel-modalities');
searchCode('panel-cadastros code', 'panel-cadastros');
searchCode('panel-reports code', 'panel-reports');
searchCode('panel-backup code', 'panel-backup');
