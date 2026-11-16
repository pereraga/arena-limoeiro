const fs = require('fs');
const repoRoot = 'C:/Users/PC/.gemini/antigravity/scratch/arena-booking-system';
const supClient = fs.readFileSync(repoRoot + '/public/supabase-client.js', 'utf8');

const sIdx = supClient.lastIndexOf('})();');
const addition = `
  // Exporta configuração de nuvem de alta disponibilidade (Dual-Cloud DB1 e DB2)
  if (typeof window !== 'undefined') {
    window.ARENA_CLOUD_DBS = {
      db1Url: 'https://brmclyukjfijommbxhks.supabase.co',
      db1Key: 'sb_publishable__bNeBgn98phx-HCEAF1WLA_2L6XD-F7',
      db2Url: 'https://aukrcnhuyultkjqsgvea.supabase.co',
      db2Key: 'sb_publishable_fbvIo7C-gfP0pKRdvJcPIg_GfrizeAi',
      syncEndpoint: '/api/sync'
    };
  }
`;

const newContent = supClient.slice(0, sIdx) + addition + supClient.slice(sIdx);
fs.writeFileSync(repoRoot + '/public/supabase-client.js', newContent, 'utf8');
console.log('ARENA_CLOUD_DBS exported in public/supabase-client.js!');
