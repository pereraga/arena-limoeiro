const fs = require('fs');
let code = fs.readFileSync('public/app.js', 'utf8');

// 1. addCourtModalGalleryImage
const oldAdd = `function addCourtModalGalleryImage(url) {
  const raw = (url || '').trim();
  const clean = convertDriveLink(raw);
  if (!clean) return;
  window._courtModalGallery = window._courtModalGallery || [];
  if (!window._courtModalGallery.includes(clean)) {
    window._courtModalGallery.push(clean);
  }
  renderCourtModalGallery();
  const input = document.getElementById('courtNewPhotoUrl');
  if (input) input.value = '';
}`.replace(/\n/g, '\r\n');

const newAdd = `function addCourtModalGalleryImage(url) {
  const raw = (url || '').trim();
  const clean = convertDriveLink(raw);
  if (!clean) return;
  window._courtModalGallery = window._courtModalGallery || [];
  const isDefaultUnsplash = (img) => typeof img === 'string' && img.includes('images.unsplash.com');
  if (window._courtModalGallery.length === 1 && isDefaultUnsplash(window._courtModalGallery[0])) {
    window._courtModalGallery = [clean];
  } else if (!window._courtModalGallery.includes(clean)) {
    window._courtModalGallery.push(clean);
  }
  renderCourtModalGallery();
  const input = document.getElementById('courtNewPhotoUrl');
  if (input) input.value = '';
}`.replace(/\n/g, '\r\n');

if (code.includes(oldAdd)) {
  code = code.replace(oldAdd, newAdd);
  console.log('✅ addCourtModalGalleryImage atualizado com sucesso!');
} else {
  console.log('❌ oldAdd não encontrado');
}

// 2. Proteção nas sincronizações ArenaCloudSync.pull (L22175)
const oldSync1 = `        if (Array.isArray(cloudData.courts) && cloudData.courts.length > 0) {
          state.courts = cloudData.courts.map(normalizeCourt);
          localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));
        }`.replace(/\n/g, '\r\n');

const newSync1 = `        if (Array.isArray(cloudData.courts) && cloudData.courts.length > 0) {
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
        }`.replace(/\n/g, '\r\n');

if (code.includes(oldSync1)) {
  code = code.replace(oldSync1, newSync1);
  console.log('✅ oldSync1 atualizado com sucesso!');
} else {
  console.log('❌ oldSync1 não encontrado');
}

// 3. Proteção na segunda rotina do ArenaCloudSync.pull (L22628)
const oldSync2 = `              const normCourts = cloudData.courts.map(normalizeCourt);
              if (JSON.stringify(normCourts) !== JSON.stringify(state.courts)) {
                state.courts = normCourts;
                localStorage.setItem('arena_local_courts', JSON.stringify(normCourts));
                _refreshAllUI();
              }`.replace(/\n/g, '\r\n');

const newSync2 = `              const savedCustomPhotos = JSON.parse(localStorage.getItem('arena_custom_court_photos') || '{}');
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
              }`.replace(/\n/g, '\r\n');

if (code.includes(oldSync2)) {
  code = code.replace(oldSync2, newSync2);
  console.log('✅ oldSync2 atualizado com sucesso!');
} else {
  console.log('❌ oldSync2 não encontrado');
}

fs.writeFileSync('public/app.js', code, 'utf8');
console.log('Arquivo salvo com sucesso!');
