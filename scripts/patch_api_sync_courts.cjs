const fs = require('fs');

let syncJs = fs.readFileSync('api/sync.js', 'utf8');

// Check line 310:
// if (Array.isArray(payload.courts) && payload.courts.length > 0) { current.courts = payload.courts; modified = true; }
// Notice in update_court (line 366):
// else if (action === 'update_court' && payload && payload.id)

// In sync_all:
// If payload.courts is provided:
// Merge courts preserving custom images if already set, or updating them!
const oldSyncAllCourts = `        // Atualizar Quadras se fornecido
        if (Array.isArray(payload.courts) && payload.courts.length > 0) {
          current.courts = payload.courts;
          modified = true;
        }`;

const newSyncAllCourts = `        // Atualizar Quadras se fornecido (com mesclagem inteligente e sincronização de fotos)
        if (Array.isArray(payload.courts) && payload.courts.length > 0) {
          if (!Array.isArray(current.courts) || current.courts.length === 0) {
            current.courts = payload.courts;
          } else {
            const courtMap = new Map(current.courts.map(c => [c.id, c]));
            for (const c of payload.courts) {
              if (c && c.id) {
                const existing = courtMap.get(c.id);
                // Se o payload tiver imagem válida atualizada, sobrepõe a imagem existente
                courtMap.set(c.id, existing ? { ...existing, ...c } : c);
              }
            }
            current.courts = Array.from(courtMap.values());
          }
          modified = true;
        }`;

if (syncJs.includes(oldSyncAllCourts)) {
  syncJs = syncJs.replace(oldSyncAllCourts, newSyncAllCourts);
  console.log('Updated sync_all courts logic in api/sync.js');
  fs.writeFileSync('api/sync.js', syncJs, 'utf8');
} else {
  console.log('Could not find oldSyncAllCourts directly, checking with CRLF...');
  const oldSyncAllCourtsCRLF = oldSyncAllCourts.replace(/\n/g, '\r\n');
  if (syncJs.includes(oldSyncAllCourtsCRLF)) {
    syncJs = syncJs.replace(oldSyncAllCourtsCRLF, newSyncAllCourts.replace(/\n/g, '\r\n'));
    console.log('Updated sync_all courts logic in api/sync.js (CRLF)');
    fs.writeFileSync('api/sync.js', syncJs, 'utf8');
  } else {
    console.error('Failed to match oldSyncAllCourts');
  }
}
