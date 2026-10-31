const fs = require('fs');

const content = fs.readFileSync('C:/Users/PC/Downloads/index (1).html', 'utf8');
console.log('File size:', content.length);
console.log('First 600 chars:');
console.log(content.slice(0, 600));

// Check title
const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
console.log('Title:', titleMatch ? titleMatch[1] : 'No title');

// Check script tags or supabase references
const hasSupabase = content.includes('supabase') || content.includes('brmclyukjfijommbxhks') || content.includes('aukrcnhuyultkjqsgvea');
console.log('Has supabase references:', hasSupabase);

// Check if it's a standalone full bundle
const scriptCount = (content.match(/<script/g) || []).length;
console.log('Script count:', scriptCount);
