const fs = require('fs');
const path = require('path');

// 1. Update api/sync.js
const syncPath = path.join(__dirname, '..', 'api', 'sync.js');
let syncContent = fs.readFileSync(syncPath, 'utf8');

const targetStr = `else if ((action === 'delete_monthly' || action === 'delete_monthly_member') && payload.id) {`;
const replacementStr = `else if (action === 'update_court' && payload && (payload.id || payload.dbId)) {
      const targetCourtId = payload.dbId || payload.id;
      const courtPayload = {
        name: payload.name,
        base_price_per_hour: parseFloat(payload.base_price_per_hour || payload.price || 100),
        observation: payload.observation || payload.status || 'operacional'
      };
      if (payload.specs) courtPayload.specs = payload.specs;
      await fetch(\`\${SUPABASE_DB2_URL}/rest/v1/courts?id=eq.\${encodeURIComponent(targetCourtId)}\`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_DB2_KEY,
          Authorization: \`Bearer \${SUPABASE_DB2_KEY}\`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(courtPayload)
      }).catch(err => console.warn('[Sync Mirror DB2] Erro ao sincronizar quadra:', err));
    } else if ((action === 'delete_monthly' || action === 'delete_monthly_member') && payload.id) {`;

if (syncContent.includes(targetStr)) {
  syncContent = syncContent.replace(targetStr, replacementStr);
  fs.writeFileSync(syncPath, syncContent, 'utf8');
  console.log('api/sync.js successfully updated with update_court mirror handler!');
} else {
  console.error('Target not found in api/sync.js');
}
