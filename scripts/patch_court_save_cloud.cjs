const fs = require('fs');

let appJs = fs.readFileSync('public/app.js', 'utf8');

// In handleCourtFormSubmit (around line 20430):
// After saving to Banco 2:
// We should also push to window.ArenaCloudSync:
// window.ArenaCloudSync.push('update_court', savedCourt);
// and window.ArenaCloudSync.push('sync_all', { courts: state.courts });

const searchTarget = `      if (window.ArenaSupabase && window.ArenaSupabase.broadcastCourtUpdate) {
        window.ArenaSupabase.broadcastCourtUpdate(savedCourt);
      }`;

const replacement = `      if (window.ArenaSupabase && window.ArenaSupabase.broadcastCourtUpdate) {
        window.ArenaSupabase.broadcastCourtUpdate(savedCourt);
      }

      // ☁️ Sincronização em Nuvem Imediata (Celulares, Outros Aparelhos e Visitantes)
      if (window.ArenaCloudSync) {
        window.ArenaCloudSync.push('update_court', {
          id: savedCourt.id,
          name: savedCourt.name,
          image: savedCourt.image,
          gallery: savedCourt.gallery,
          specs: savedCourt.specs
        });
        window.ArenaCloudSync.push('sync_all', { courts: state.courts });
      }`;

if (appJs.includes(searchTarget)) {
  appJs = appJs.replace(searchTarget, replacement);
  console.log('Added ArenaCloudSync push to handleCourtFormSubmit (LF)');
  fs.writeFileSync('public/app.js', appJs, 'utf8');
} else {
  const searchTargetCRLF = searchTarget.replace(/\n/g, '\r\n');
  if (appJs.includes(searchTargetCRLF)) {
    appJs = appJs.replace(searchTargetCRLF, replacement.replace(/\n/g, '\r\n'));
    console.log('Added ArenaCloudSync push to handleCourtFormSubmit (CRLF)');
    fs.writeFileSync('public/app.js', appJs, 'utf8');
  } else {
    console.error('Could not find searchTarget in app.js');
  }
}
