const fs = require('fs');
const path = 'public/app.js';
let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

const newUploadLines = [
  "function handleCourtImageUpload(inputEl) {",
  "  if (!inputEl || !inputEl.files || !inputEl.files[0]) return;",
  "  const file = inputEl.files[0];",
  "  if (typeof showNotification === 'function') {",
  "    showNotification('Carregando foto...', 'info');",
  "  }",
  "  const reader = new FileReader();",
  "  reader.onload = function(e) {",
  "    const rawDataUrl = e.target.result;",
  "    const img = new Image();",
  "    img.onload = function() {",
  "      const maxWidth = 960;",
  "      const maxHeight = 640;",
  "      let width = img.width;",
  "      let height = img.height;",
  "      if (width > maxWidth) {",
  "        height = Math.round((height * maxWidth) / width);",
  "        width = maxWidth;",
  "      }",
  "      if (height > maxHeight) {",
  "        width = Math.round((width * maxHeight) / height);",
  "        width = maxHeight;",
  "      }",
  "      const canvas = document.createElement('canvas');",
  "      canvas.width = width;",
  "      canvas.height = height;",
  "      const ctx = canvas.getContext('2d');",
  "      ctx.drawImage(img, 0, 0, width, height);",
  "      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);",
  "      addCourtModalGalleryImage(compressedDataUrl);",
  "      inputEl.value = '';",
  "      if (typeof showNotification === 'function') {",
  "        showNotification('Foto adicionada! Clique em \"Salvar Alterações\" abaixo para publicar.', 'success');",
  "      }",
  "    };",
  "    img.onerror = function() {",
  "      addCourtModalGalleryImage(rawDataUrl);",
  "      inputEl.value = '';",
  "      if (typeof showNotification === 'function') {",
  "        showNotification('Foto adicionada! Clique em \"Salvar Alterações\" para publicar.', 'success');",
  "      }",
  "    };",
  "    img.src = rawDataUrl;",
  "  };",
  "  reader.readAsDataURL(file);",
  "}"
];

// Substitui as linhas 19011 até 19043
lines.splice(19011, 33, ...newUploadLines);
fs.writeFileSync(path, lines.join('\r\n'), 'utf8');
console.log('Substituição por linhas concluída com sucesso!');
