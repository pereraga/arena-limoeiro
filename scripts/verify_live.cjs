const https = require('https');

const url = 'https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth?_t=' + Date.now();

https.get(url, (res) => {
  console.log('Status HTTP:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Tamanho recebido:', data.length);
    console.log('Removido da barra superior:', !data.includes('id="btnTab-modalities"'));
    console.log('Botão Quadras interno presente:', data.includes('id="btnCourtsSub-quadras"'));
    console.log('Botão Modalidades interno presente:', data.includes('id="btnCourtsSub-modalidades"'));
    console.log('Função switchCourtsSubTab presente:', data.includes('switchCourtsSubTab'));
  });
});
