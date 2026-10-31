const fs = require('fs');

const content = fs.readFileSync('C:/Users/PC/Downloads/index (1).html', 'utf8');

// Search for keywords
const keywords = ['localhost', 'fetch(', 'api/', 'booking', 'admin', 'quadra', 'court', 'localStorage', 'IndexedDB'];
keywords.forEach(kw => {
  const count = (content.split(kw).length - 1);
  console.log(`Keyword "${kw}": ${count} occurrences`);
});

// Find script content start and end
const scriptStart = content.indexOf('<script');
const scriptEnd = content.lastIndexOf('</script>');

console.log('Script tag starts at:', scriptStart, 'ends at:', scriptEnd);
if (scriptStart !== -1) {
  console.log('Script preview (first 1000 chars):');
  console.log(content.slice(scriptStart, scriptStart + 1000));
}
