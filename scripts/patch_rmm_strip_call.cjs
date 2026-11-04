const fs = require('fs');

const path = 'public/admin.html';
let content = fs.readFileSync(path, 'utf8');

const target = `    if (window.lucide) lucide.createIcons();
  };
  window.renderMovementMatches = renderMovementMatches;`;

const replacement = `    if (typeof window.updateMovementCalendarStrip === 'function') {
      window.updateMovementCalendarStrip();
    }
    if (window.lucide) lucide.createIcons();
  };
  window.renderMovementMatches = renderMovementMatches;`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('✓ Added updateMovementCalendarStrip call inside renderMovementMatches');
} else {
  console.warn('Target not found');
}
