# Estudio Jurídico Giménez — reglas del proyecto

## Cómo está armado
- Toda la app es UN archivo: `public/index.html` (HTML + CSS + JS vanilla).
- `worker.js` es GENERADO por `build-worker.js` (mete el HTML dentro de un template literal). No se edita a mano.
- Deploy: Cloudflare Worker `estudio-gimenez` → https://estudio-gimenez.querida-tienda.workers.dev

## Reglas (la pantalla en blanco pasó 3 veces por romper estas)
1. Editar SOLO `public/index.html`. Nunca `worker.js`.
2. En `index.html` los template literals van normales: `` `texto ${x}` ``. NUNCA `` \` `` ni `\${` — esos escapes son solo de worker.js. Si copiás código de worker.js, sacale las barras.
3. Deployar con `npx wrangler deploy` (o `npm run deploy`). El `[build]` de wrangler.toml corre `build-worker.js`, que valida el JS y cancela el deploy si hay error. No saltear ni borrar ese control.
4. Después de agregar una funcionalidad: deploy, abrir la URL, entrar con un usuario y recorrer las secciones antes de decir "listo".
