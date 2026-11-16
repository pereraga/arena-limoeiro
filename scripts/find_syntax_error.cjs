const fs = require('fs');
const repoRoot = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const content = fs.readFileSync(repoRoot + '/public/admin.html', 'utf8');

const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = regex.exec(content)) !== null) {
  count++;
  if (count === 14) {
    const code = match[1];
    console.log('Script 14 length:', code.length);
    // Find the error line using babel or acorn or line-by-line / binary search
    const lines = code.split('\n');
    console.log('Total lines:', lines.length);

    // Binary search for syntax error line
    let low = 1;
    let high = lines.length;
    let lastValid = 1;
    
    // Test parsing with Function
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const testCode = lines.slice(0, mid).join('\n');
      try {
        new Function(testCode);
        lastValid = mid;
        low = mid + 1;
      } catch (err) {
        if (err.message.includes('Unexpected end of input')) {
          // Incomplete code is normal when slicing, keep searching forward
          lastValid = mid;
          low = mid + 1;
        } else {
          // Found syntax error before or at mid
          high = mid - 1;
        }
      }
    }
    console.log('Approximate error around line:', low, 'to', high);
    for (let i = Math.max(0, high - 10); i < Math.min(lines.length, high + 10); i++) {
      console.log(`L${i+1}: ${lines[i]}`);
    }
    break;
  }
}
