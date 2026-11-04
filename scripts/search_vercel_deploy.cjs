const fs = require('fs');
const lines = fs.readFileSync('C:/Users/PC/.gemini/antigravity/brain/0458d57d-b3d4-46a7-9522-b1f353ae414e/.system_generated/logs/transcript.jsonl', 'utf8').trim().split('\n');
const matching = lines.filter(l => l.includes('dpl_') || l.includes('vercel.app'));
console.log('Found occurrences:', matching.length);
matching.slice(-5).forEach(m => {
  const parsed = JSON.parse(m);
  console.log(`Step ${parsed.step_index}:`, parsed.content ? parsed.content.slice(0, 300) : (parsed.tool_calls ? JSON.stringify(parsed.tool_calls) : ''));
});
