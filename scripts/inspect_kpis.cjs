const fs = require('fs');
const html = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html', 'utf8');

// Search for kpi-value-revenue
const lines = html.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('kpi-value-revenue') || line.includes('FATURAMENTO PREVISTO') || line.includes('kpi-value-games') || line.includes('AO VIVO AGORA')) {
    console.log(`Line ${idx + 1}: ${line.trim().slice(0, 120)}`);
  }
});
