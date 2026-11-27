// Genera worker.js a partir de public/index.html.
// Lo ejecuta wrangler automáticamente antes de cada deploy (ver [build] en wrangler.toml).
// Si el JavaScript de la página tiene un error, CORTA el deploy: así nunca sale una pantalla en blanco.
import fs from 'fs';

const html = fs.readFileSync('./public/index.html', 'utf-8');

// --- Control 1: escapes de worker.js copiados por error dentro de index.html ---
// En index.html los template literals se escriben normal: `...${x}...`
// Las barras \` y \${ solo existen dentro de worker.js (las agrega este script).
const problemas = [];
html.split('\n').forEach((linea, i) => {
  if (linea.includes('\\`') || linea.includes('\\${')) problemas.push(`  línea ${i + 1}: ${linea.trim().slice(0, 120)}`);
});
if (problemas.length) {
  console.error('\n✗ DEPLOY CANCELADO: public/index.html tiene \\` o \\${ (escapes de worker.js).');
  console.error('  Usá ` y ${ sin barra invertida en estas líneas:\n' + problemas.join('\n') + '\n');
  process.exit(1);
}

// --- Control 2: que cada <script> de la página sea JavaScript válido ---
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
let m, n = 0;
while ((m = re.exec(html))) {
  n++;
  try {
    new Function(m[1]);
  } catch (e) {
    const inicio = html.slice(0, m.index).split('\n').length;
    console.error(`\n✗ DEPLOY CANCELADO: el <script> #${n} (empieza en la línea ${inicio} de public/index.html) tiene un error:`);
    console.error(`  ${e.message}`);
    console.error('  Para ver la línea exacta: extraer el script y correr node --check.\n');
    process.exit(1);
  }
}

// --- Generar worker.js ---
const escaped = html.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

const worker = `// ARCHIVO GENERADO por build-worker.js — NO EDITAR. Editá public/index.html.
const html = \`${escaped}\`;

export default {
  async fetch(request) {
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }
    });
  }
};
`;

fs.writeFileSync('./worker.js', worker);
console.log(`✓ index.html OK (${n} script/s válidos) → worker.js generado`);
