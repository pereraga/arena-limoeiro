const fs = require('fs');
const html = fs.readFileSync('C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system/public/admin.html', 'utf8');
const lines = html.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('Aguardando data do jogo') || line.includes('Início programado para') || line.includes('renderMatchCardHtml')) {
    console.log(`Line ${idx + 1}: ${line.trim().slice(0, 100)}`);
  }
});
