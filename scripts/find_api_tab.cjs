const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');

const regex = /tab-btn-[a-z0-9_-]+/gi;
const found = [...new Set(content.match(regex))];
console.log('Tab buttons found:', found);

const apiSection = content.indexOf('settings-view-api');
console.log('settings-view-api index:', apiSection);
if (apiSection !== -1) {
  console.log(content.substring(apiSection - 150, apiSection + 400));
}
