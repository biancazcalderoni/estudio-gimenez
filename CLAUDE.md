# Estudio Jurídico Giménez — reglas del proyecto

## Cómo está armado
- `public/index.html`: toda la app (HTML + CSS + JS vanilla). Se sirve como archivo estático.
- `src/worker.js`: el servidor. Pide contraseña (secret `APP_PASSWORD`) para TODO el sitio y expone `/api/archivos` (subir, listar, ver, borrar archivos por cliente).
- Archivos de clientes: guardados TEMPORALMENTE en KV (binding `ARCHIVOS`, máx. 25 MB por archivo). Plan: pasar a Google Drive del Google Workspace del estudio.
- Deploy: Cloudflare Worker `estudio-gimenez` → https://estudio-gimenez.querida-tienda.workers.dev
- Local: `npx wrangler dev` (contraseña de prueba en `.dev.vars`, que no se sube a git).

## Reglas (la pantalla en blanco pasó 3 veces)
1. En `index.html` los template literals van normales: `` `texto ${x}` ``. NUNCA `` \` `` ni `\${`.
2. Deployar con `npx wrangler deploy`. El `[build]` de wrangler.toml corre `check-html.js`, que valida el JS y cancela el deploy si hay error. No saltear ni borrar ese control.
3. Todo dato que escribe un usuario (nombres de archivo, clientes) se muestra con `esc()` para no romper el HTML.
4. Después de cada cambio: deploy, abrir la URL, entrar y recorrer las secciones antes de decir "listo".
5. Son documentos legales confidenciales: nunca sacar la contraseña ni exponer `/api/archivos` sin sesión.
