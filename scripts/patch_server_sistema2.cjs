const fs = require('fs');

let serverCode = fs.readFileSync('server.js', 'utf8');

// In server.js, before app.use(express.static(path.join(__dirname, 'public')));
// We can serve index-sistema2.html at /
// And keep /sistema1 or /original serving index.html if needed!

const staticAnchor = "app.use(express.static(path.join(__dirname, 'public')));";

const routerSistema2 = `// Rota Principal para o Sistema 2 (index (1).html com Banco de Dados vinculado)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index-sistema2.html'));
});

// Acesso opcional ao Sistema 1 no servidor local
app.get('/sistema1', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));`;

if (serverCode.includes(staticAnchor)) {
  serverCode = serverCode.replace(staticAnchor, routerSistema2);
  fs.writeFileSync('server.js', serverCode, 'utf8');
  console.log('Successfully updated server.js to route / to index-sistema2.html!');
} else {
  console.error('Could not find staticAnchor in server.js');
}
