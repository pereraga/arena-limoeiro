const fs = require('fs');
const path = 'public/app.js';
let code = fs.readFileSync(path, 'utf8');

// 1. Função convertDriveLink e atualização da sanitizeCourtUrl
const driveFunction = `// Converte link do Google Drive para link direto de imagem funcional
function convertDriveLink(url) {
  if (!url || typeof url !== 'string') return url;
  const u = url.trim();

  let fileId = null;
  const matchFile = u.match(/drive\\.google\\.com\\/file\\/d\\/([a-zA-Z0-9_-]+)/);
  if (matchFile) fileId = matchFile[1];
  if (!fileId) {
    const matchOpen = u.match(/drive\\.google\\.com\\/open\\?id=([a-zA-Z0-9_-]+)/);
    if (matchOpen) fileId = matchOpen[1];
  }
  if (!fileId) {
    const matchUc = u.match(/drive\\.google\\.com\\/uc\\?.*id=([a-zA-Z0-9_-]+)/);
    if (matchUc) fileId = matchUc[1];
  }
  if (!fileId) {
    const matchThumb = u.match(/drive\\.google\\.com\\/thumbnail\\?.*id=([a-zA-Z0-9_-]+)/);
    if (matchThumb) fileId = matchThumb[1];
  }
  if (!fileId) {
    const matchLh3 = u.match(/lh3\\.googleusercontent\\.com\\/d\\/([a-zA-Z0-9_-]+)/);
    if (matchLh3) fileId = matchLh3[1];
  }

  if (fileId) {
    return 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1200';
  }
  return u;
}
window.convertDriveLink = convertDriveLink;

`;

code = code.replace(
  /function sanitizeCourtUrl\(url\) \{([\s\S]*?)return url;\r?\n\}/,
  driveFunction + `function sanitizeCourtUrl(url) {
  if (!url || typeof url !== 'string') return 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80';
  if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
    return convertDriveLink(url);
  }
  if (url.includes('photo-1529900245534-47fbf8204bca') || url.includes('photo-1508098682722-e99c43a406b2')) {
    return 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80';
  }
  if (url.includes('photo-1518604666864-7423958f7660')) {
    return 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=800&auto=format&fit=crop&q=80';
  }
  if (url.includes('photo-1517649763962-0c623266ddc0')) {
    return 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80';
  }
  return url;
}`
);

// 2. No modal ao adicionar foto de URL, converter link do Google Drive
code = code.replace(
  `function addCourtModalGalleryImage(url) {\r\n  const clean = (url || '').trim();`,
  `function addCourtModalGalleryImage(url) {\r\n  const raw = (url || '').trim();\r\n  const clean = convertDriveLink(raw);`
);

// 3. Ao submeter o formulário da quadra (handleCourtFormSubmit), salvar a foto customizada no mapa 'arena_custom_court_photos'
code = code.replace(
  `// Persistir em localStorage\r\n  try {\r\n    localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));\r\n  } catch(e) {\r\n    console.warn('Erro ao salvar no localStorage:', e);\r\n  }`,
  `// Persistir em localStorage\r\n  try {\r\n    localStorage.setItem('arena_local_courts', JSON.stringify(state.courts));\r\n    const customPhotos = JSON.parse(localStorage.getItem('arena_custom_court_photos') || '{}');\r\n    customPhotos[id] = { image: savedCourt.image, gallery: savedCourt.gallery };\r\n    localStorage.setItem('arena_custom_court_photos', JSON.stringify(customPhotos));\r\n  } catch(e) {\r\n    console.warn('Erro ao salvar no localStorage:', e);\r\n  }`
);

// 4. Ao sincronizar do Supabase (syncDataFromSupabase), preservar as fotos customizadas locais sem deixar o banco sobrescrever com foto padrão
code = code.replace(
  `state.courts = dbCourts.map(normalizeCourt);`,
  `const savedCustomPhotos = JSON.parse(localStorage.getItem('arena_custom_court_photos') || '{}');\r\n        state.courts = dbCourts.map(c => {\r\n          const norm = normalizeCourt(c);\r\n          if (savedCustomPhotos[norm.id] && savedCustomPhotos[norm.id].image) {\r\n            norm.image = savedCustomPhotos[norm.id].image;\r\n            if (Array.isArray(savedCustomPhotos[norm.id].gallery)) {\r\n              norm.gallery = savedCustomPhotos[norm.id].gallery;\r\n              if (norm.specs) norm.specs.gallery = savedCustomPhotos[norm.id].gallery;\r\n            }\r\n          }\r\n          return norm;\r\n        });`
);

// 5. Ao inicializar os dados locais (loadInitialData), restaurar fotos customizadas
code = code.replace(
  `state.courts = localCourts.map(normalizeCourt);`,
  `const initCustomPhotos = JSON.parse(localStorage.getItem('arena_custom_court_photos') || '{}');\r\n      state.courts = localCourts.map(c => {\r\n        const norm = normalizeCourt(c);\r\n        if (initCustomPhotos[norm.id] && initCustomPhotos[norm.id].image) {\r\n          norm.image = initCustomPhotos[norm.id].image;\r\n          if (Array.isArray(initCustomPhotos[norm.id].gallery)) {\r\n            norm.gallery = initCustomPhotos[norm.id].gallery;\r\n            if (norm.specs) norm.specs.gallery = initCustomPhotos[norm.id].gallery;\r\n          }\r\n        }\r\n        return norm;\r\n      });`
);

// 6. Impedir que onerror substitua imagens para as fotos antigas do Unsplash
code = code.replace(
  /onerror="this\.src='https:\/\/images\.unsplash\.com\/photo-1574629810360-7efbbe195018\?w=800&auto=format&fit=crop&q=80'"/g,
  `onerror="if(!this.dataset.errored){this.dataset.errored='1';console.warn('Falha imagem:',this.src);}"`
);

fs.writeFileSync(path, code, 'utf8');
console.log('Script executado com precisão!');
