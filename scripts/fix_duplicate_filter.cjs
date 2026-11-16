const fs = require('fs');
const repoRoot = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const filePath = repoRoot + '/public/admin.html';
let content = fs.readFileSync(filePath, 'utf8');

const badSnippet = `    renderMovementMatches();
  };
    const courtEl = document.getElementById('movementCourtFilter');
    const statusEl = document.getElementById('movementStatusFilter');
    if (courtEl) window.adminGameState.movementFilterCourt = courtEl.value;
    if (statusEl) window.adminGameState.movementFilterStatus = statusEl.value;
    renderMovementMatches();
  };`;

const goodSnippet = `    renderMovementMatches();
  };`;

if (!content.includes(badSnippet)) {
  console.error('Bad snippet not found!');
  process.exit(1);
}

content = content.replace(badSnippet, goodSnippet);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully fixed syntax error in public/admin.html!');
