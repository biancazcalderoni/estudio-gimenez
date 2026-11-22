const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('❌ Error: ANTHROPIC_API_KEY no está configurada');
  console.error('Usa: ANTHROPIC_API_KEY=sk-ant-... node server.js');
  process.exit(1);
}

const htmlPath = path.join(__dirname, 'estudio-gimenez-v2.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    // Inyecta la API key en el estado inicial
    const modifiedHTML = htmlContent.replace(
      "apiKey: localStorage.getItem('anthropic_api_key') || ''",
      `apiKey: '${API_KEY}'`
    );

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(modifiedHTML);
  } else {
    res.writeHead(404);
    res.end('No encontrado');
  }
});

server.listen(PORT, () => {
  console.log(`\n✅ Servidor iniciado en http://localhost:${PORT}`);
  console.log(`🔑 API Key configurada: ${API_KEY.substring(0, 20)}...`);
  console.log(`\n📌 Presiona Ctrl+C para detener el servidor\n`);
});
