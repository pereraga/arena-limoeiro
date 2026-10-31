const fs = require('fs');

let indexHtml = fs.readFileSync('public/index.html', 'utf8');

if (!indexHtml.includes('cdn.jsdelivr.net/npm/chart.js')) {
  const chartScriptTag = '  <!-- Chart.js CDN -->\n  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n';
  indexHtml = indexHtml.replace('  <!-- Supabase JS Client & Config -->', chartScriptTag + '  <!-- Supabase JS Client & Config -->');
  fs.writeFileSync('public/index.html', indexHtml, 'utf8');
  console.log('Chart.js CDN added to public/index.html');
} else {
  console.log('Chart.js CDN already present in public/index.html');
}
