const fs = require('fs');

let appJs = fs.readFileSync('public/app.js', 'utf8');

// Inspect where customPhotos are checked in syncDataFromSupabase and checkAndSyncBookingsBackground
// 1. syncDataFromSupabase:
// const savedCustomPhotos = JSON.parse(localStorage.getItem('arena_custom_court_photos') || '{}');
// state.courts = cloudData.courts.map(c => {
//   const norm = normalizeCourt(c);
//   if (savedCustomPhotos[norm.id] && savedCustomPhotos[norm.id].image) {
// ...
// If cloudData has a custom photo (not default unsplash or different), and savedCustomPhotos doesn't,
// savedCustomPhotos should be updated with the cloud custom photo!

const oldSyncMapCRLF = `        if (Array.isArray(cloudData.courts) && cloudData.courts.length > 0) {
          const savedCustomPhotos = JSON.parse(localStorage.getItem('arena_custom_court_photos') || '{}');
          state.courts = cloudData.courts.map(c => {
            const norm = normalizeCourt(c);
            if (savedCustomPhotos[norm.id] && savedCustomPhotos[norm.id].image) {
              norm.image = savedCustomPhotos[norm.id].image;
              if (Array.isArray(savedCustomPhotos[norm.id].gallery)) {
                norm.gallery = savedCustomPhotos[norm.id].gallery;
                if (norm.specs) norm.specs.gallery = savedCustomPhotos[norm.id].gallery;
              }
            }
            return norm;
          });
          localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));
        }`;

const newSyncMap = `        if (Array.isArray(cloudData.courts) && cloudData.courts.length > 0) {
          const savedCustomPhotos = JSON.parse(localStorage.getItem('arena_custom_court_photos') || '{}');
          state.courts = cloudData.courts.map(c => {
            const norm = normalizeCourt(c);
            if (savedCustomPhotos[norm.id] && savedCustomPhotos[norm.id].image) {
              norm.image = savedCustomPhotos[norm.id].image;
              if (Array.isArray(savedCustomPhotos[norm.id].gallery)) {
                norm.gallery = savedCustomPhotos[norm.id].gallery;
                if (norm.specs) norm.specs.gallery = savedCustomPhotos[norm.id].gallery;
              }
            } else if (norm.image) {
              // Se a nuvem trouxe uma foto oficial da quadra, sincroniza para a máquina de todos os usuários
              savedCustomPhotos[norm.id] = { image: norm.image, gallery: norm.gallery || [norm.image] };
            }
            return norm;
          });
          localStorage.setItem('arena_custom_court_photos', JSON.stringify(savedCustomPhotos));
          localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));
        }`;

// Replace in both sync functions
function replaceAllSyncMaps(content) {
  let res = content;
  
  // Replace 1 in syncDataFromSupabase
  const target1 = `        if (Array.isArray(cloudData.courts) && cloudData.courts.length > 0) {
          const savedCustomPhotos = JSON.parse(localStorage.getItem('arena_custom_court_photos') || '{}');
          state.courts = cloudData.courts.map(c => {
            const norm = normalizeCourt(c);
            if (savedCustomPhotos[norm.id] && savedCustomPhotos[norm.id].image) {
              norm.image = savedCustomPhotos[norm.id].image;
              if (Array.isArray(savedCustomPhotos[norm.id].gallery)) {
                norm.gallery = savedCustomPhotos[norm.id].gallery;
                if (norm.specs) norm.specs.gallery = savedCustomPhotos[norm.id].gallery;
              }
            }
            return norm;
          });
          localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));
        }`;

  // Replace 2 in checkAndSyncBookingsBackground
  const target2 = `            if (!hasMock && hasFutCourts) {
              const savedCustomPhotos = JSON.parse(localStorage.getItem('arena_custom_court_photos') || '{}');
              const normCourts = cloudData.courts.map(c => {
                const norm = normalizeCourt(c);
                if (savedCustomPhotos[norm.id] && savedCustomPhotos[norm.id].image) {
                  norm.image = savedCustomPhotos[norm.id].image;
                  if (Array.isArray(savedCustomPhotos[norm.id].gallery)) {
                    norm.gallery = savedCustomPhotos[norm.id].gallery;
                    if (norm.specs) norm.specs.gallery = savedCustomPhotos[norm.id].gallery;
                  }
                }
                return norm;
              });
              if (JSON.stringify(normCourts) !== JSON.stringify(state.courts)) {
                state.courts = normCourts;
                localStorage.setItem('arena_local_courts', JSON.stringify(normCourts));
                _refreshAllUI();
              }
            }`;

  const newTarget2 = `            if (!hasMock && hasFutCourts) {
              const savedCustomPhotos = JSON.parse(localStorage.getItem('arena_custom_court_photos') || '{}');
              const normCourts = cloudData.courts.map(c => {
                const norm = normalizeCourt(c);
                if (savedCustomPhotos[norm.id] && savedCustomPhotos[norm.id].image) {
                  norm.image = savedCustomPhotos[norm.id].image;
                  if (Array.isArray(savedCustomPhotos[norm.id].gallery)) {
                    norm.gallery = savedCustomPhotos[norm.id].gallery;
                    if (norm.specs) norm.specs.gallery = savedCustomPhotos[norm.id].gallery;
                  }
                } else if (norm.image) {
                  savedCustomPhotos[norm.id] = { image: norm.image, gallery: norm.gallery || [norm.image] };
                }
                return norm;
              });
              localStorage.setItem('arena_custom_court_photos', JSON.stringify(savedCustomPhotos));
              if (JSON.stringify(normCourts) !== JSON.stringify(state.courts)) {
                state.courts = normCourts;
                localStorage.setItem('arena_local_courts', JSON.stringify(normCourts));
                _refreshAllUI();
              }
            }`;

  // Replace CRLF or LF
  res = res.split(target1).join(newSyncMap);
  res = res.split(target1.replace(/\n/g, '\r\n')).join(newSyncMap.replace(/\n/g, '\r\n'));

  res = res.split(target2).join(newTarget2);
  res = res.split(target2.replace(/\n/g, '\r\n')).join(newTarget2.replace(/\n/g, '\r\n'));

  return res;
}

appJs = replaceAllSyncMaps(appJs);
fs.writeFileSync('public/app.js', appJs, 'utf8');
console.log('Successfully updated sync functions to store and broadcast custom court photos across all devices!');
