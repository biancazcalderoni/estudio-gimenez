// Worker de Estudio Giménez.
// - La página (public/index.html) se sirve como archivo estático: ya NO se mete adentro de este archivo.
// - Todo está detrás de una contraseña (secret APP_PASSWORD) porque hay documentos de clientes.
// - /api/archivos: subir, listar, ver y borrar archivos por cliente.
//   Almacenamiento TEMPORAL en KV (binding ARCHIVOS) hasta conectar Google Drive.

const COOKIE = 'eg_sesion';
const DIAS_SESION = 30;
const MAX_ARCHIVO = 25 * 1024 * 1024; // límite de KV: 25 MB por valor

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/login' && request.method === 'POST') return login(request, env);
    if (url.pathname === '/logout') return logout();

    if (!env.APP_PASSWORD) {
      return html(paginaLogin('Falta configurar la contraseña del sitio (APP_PASSWORD).', false), 503);
    }
    if (!(await sesionValida(request, env))) {
      if (url.pathname.startsWith('/api/')) return json({ error: 'No autorizado' }, 401);
      return html(paginaLogin('', true), 401);
    }

    if (url.pathname === '/api/archivos' || url.pathname.startsWith('/api/archivos/')) {
      return archivos(request, env, url);
    }
    if (url.pathname.startsWith('/api/')) return json({ error: 'No existe' }, 404);

    return env.ASSETS.fetch(request);
  },
};

// ---------- Archivos ----------

async function archivos(request, env, url) {
  const clave = decodeURIComponent(url.pathname.slice('/api/archivos/'.length));

  // Listar: GET /api/archivos?cliente=ID
  if (request.method === 'GET' && !clave) {
    const cliente = idCliente(url.searchParams.get('cliente'));
    if (!cliente) return json({ error: 'Falta el cliente' }, 400);
    const lista = await env.ARCHIVOS.list({ prefix: `c/${cliente}/` });
    const items = lista.keys
      .map(k => ({ clave: k.name, ...(k.metadata || {}) }))
      .sort((a, b) => (b.subido || '').localeCompare(a.subido || ''));
    return json({ archivos: items });
  }

  // Subir: POST /api/archivos?cliente=ID  (cuerpo = el archivo; nombre en X-Nombre)
  if (request.method === 'POST' && !clave) {
    const cliente = idCliente(url.searchParams.get('cliente'));
    const nombre = decodeURIComponent(request.headers.get('X-Nombre') || '').trim().slice(0, 200);
    if (!cliente || !nombre) return json({ error: 'Falta cliente o nombre' }, 400);
    const tipo = request.headers.get('Content-Type') || 'application/octet-stream';
    const datos = await request.arrayBuffer();
    if (datos.byteLength === 0) return json({ error: 'El archivo está vacío' }, 400);
    if (datos.byteLength > MAX_ARCHIVO) return json({ error: 'El archivo supera 25 MB' }, 413);
    const meta = {
      nombre,
      tipo,
      tamano: datos.byteLength,
      subido: new Date().toISOString(),
      por: (request.headers.get('X-Usuario') || '').slice(0, 40),
    };
    const nuevaClave = `c/${cliente}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    await env.ARCHIVOS.put(nuevaClave, datos, { metadata: meta });
    return json({ archivo: { clave: nuevaClave, ...meta } }, 201);
  }

  if (!clave.startsWith('c/')) return json({ error: 'Archivo inválido' }, 400);

  // Ver / descargar: GET /api/archivos/<clave>[?descargar=1]
  if (request.method === 'GET') {
    const { value, metadata } = await env.ARCHIVOS.getWithMetadata(clave, { type: 'arrayBuffer' });
    if (!value) return json({ error: 'No existe' }, 404);
    const nombre = (metadata && metadata.nombre) || 'archivo';
    const modo = url.searchParams.get('descargar') ? 'attachment' : 'inline';
    return new Response(value, {
      headers: {
        'Content-Type': (metadata && metadata.tipo) || 'application/octet-stream',
        'Content-Disposition': `${modo}; filename*=UTF-8''${encodeURIComponent(nombre)}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  // Borrar: DELETE /api/archivos/<clave>
  if (request.method === 'DELETE') {
    await env.ARCHIVOS.delete(clave);
    return json({ ok: true });
  }

  return json({ error: 'Método no permitido' }, 405);
}

function idCliente(v) {
  const s = String(v || '').trim();
  return /^[\w-]{1,64}$/.test(s) ? s : null;
}

// ---------- Sesión ----------

async function login(request, env) {
  const form = await request.formData();
  const pass = String(form.get('password') || '');
  if (!env.APP_PASSWORD || pass !== env.APP_PASSWORD) {
    return html(paginaLogin('Contraseña incorrecta.', true), 401);
  }
  const vence = Date.now() + DIAS_SESION * 864e5;
  const token = `${vence}.${await firmar(String(vence), env)}`;
  return new Response(null, {
    status: 303,
    headers: {
      Location: '/',
      'Set-Cookie': `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DIAS_SESION * 86400}`,
    },
  });
}

function logout() {
  return new Response(null, {
    status: 303,
    headers: { Location: '/', 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` },
  });
}

async function sesionValida(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!m) return false;
  const [vence, firma] = m[1].split('.');
  if (!vence || !firma || Number(vence) < Date.now()) return false;
  return firma === (await firmar(vence, env));
}

// Firma con la contraseña: si se cambia APP_PASSWORD, todas las sesiones se cierran.
async function firmar(texto, env) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode('eg:' + env.APP_PASSWORD),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(texto));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, c => ({ '+': '-', '/': '_', '=': '' }[c]));
}

// ---------- Respuestas ----------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function html(body, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

function paginaLogin(mensaje, conForm) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Estudio Jurídico Gimenez</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#2c5aa0,#1f3f6b)}
  .card{background:#fff;padding:40px;border-radius:12px;width:min(320px,85vw);text-align:center}
  h1{margin:0;color:#2c5aa0;font-size:30px;letter-spacing:1px}
  p{color:#7f8c8d;margin:6px 0 28px}
  input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #d0d7e2;border-radius:8px;font-size:15px;margin-bottom:12px}
  button{width:100%;padding:12px;border:0;border-radius:8px;background:#2c5aa0;color:#fff;font-size:15px;font-weight:600;cursor:pointer}
  .err{color:#c0392b;font-size:13px;margin:0 0 12px}
</style></head><body><div class="card">
  <h1>GIMENEZ</h1><p>Estudio Jurídico</p>
  ${mensaje ? `<div class="err">${mensaje}</div>` : ''}
  ${conForm ? `<form method="POST" action="/login">
    <input type="password" name="password" placeholder="Contraseña" autocomplete="current-password" autofocus required>
    <button type="submit">Entrar</button></form>` : ''}
</div></body></html>`;
}
