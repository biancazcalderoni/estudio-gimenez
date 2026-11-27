// Control antes de cada deploy (lo corre wrangler: ver [build] en wrangler.toml).
// Si el JavaScript de public/index.html tiene un error, CORTA el deploy:
// un solo error de sintaxis deja la app entera en pantalla en blanco.
import fs from 'fs';

const html = fs.readFileSync('./public/index.html', 'utf-8');

// Control 1: barras invertidas antes de ` o ${ (vienen de copiar código del viejo worker.js).
const problemas = [];
html.split('\n').forEach((linea, i) => {
  if (linea.includes('\\`') || linea.includes('\\${')) problemas.push(`  línea ${i + 1}: ${linea.trim().slice(0, 120)}`);
});
if (problemas.length) {
  console.error('\n✗ DEPLOY CANCELADO: public/index.html tiene \\` o \\${.');
  console.error('  Usá ` y ${ sin barra invertida en estas líneas:\n' + problemas.join('\n') + '\n');
  process.exit(1);
}

// Control 2: cada <script> de la página tiene que ser JavaScript válido.
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
let m, n = 0;
while ((m = re.exec(html))) {
  n++;
  try {
    new Function(m[1]);
  } catch (e) {
    const inicio = html.slice(0, m.index).split('\n').length;
    console.error(`\n✗ DEPLOY CANCELADO: el <script> #${n} (empieza en la línea ${inicio} de public/index.html) tiene un error:`);
    console.error(`  ${e.message}\n`);
    process.exit(1);
  }
}

console.log(`✓ public/index.html OK (${n} script/s válidos)`);
