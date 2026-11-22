# 🚀 Desplegar en Cloudflare Workers

## Paso 1: Requisitos

- Cuenta en Cloudflare (https://cloudflare.com)
- Node.js 18+ instalado
- CLI de Cloudflare instalado

## Paso 2: Instalar CLI de Cloudflare

```bash
npm install -g wrangler
```

Verifica que funciona:
```bash
wrangler --version
```

## Paso 3: Autenticarse con Cloudflare

```bash
wrangler login
```

Esto abrirá tu navegador para autorizar el acceso.

## Paso 4: Configurar la API Key como Secret

```bash
wrangler secret put ANTHROPIC_API_KEY --env production
```

Cuando te pida, pega la API key de Fabián (ej: `sk-ant-...`)

Verifica que se guardó:
```bash
wrangler secret list --env production
```

## Paso 5: Desplegar

### Primera vez (crear el Worker):
```bash
npm install
npm run deploy:prod
```

### Actualizaciones después:
```bash
npm run deploy:prod
```

## Paso 6: Acceder a la app

Una vez desplegada, verás:
```
✨ Successfully published your Worker to 
  https://estudio-gimenez.bianca.workers.dev
```

Abre ese link en tu navegador y ¡listo! 🎉

---

## 📋 Comandos útiles

**Ver logs en vivo:**
```bash
wrangler tail --env production
```

**Desplegar versión development:**
```bash
npm run deploy
```

**Ver estado del deployment:**
```bash
wrangler deployments list --env production
```

---

## ⚠️ Notas importantes

- ✅ La API key se guarda **encriptada** en Cloudflare
- ✅ **NO aparece** en el código fuente
- ✅ Se inyecta **en el servidor** (lado Cloudflare)
- 🔒 Totalmente seguro

## ❌ Problemas comunes

**"Unauthorized"** → Ejecuta `wrangler login` de nuevo

**"Worker name already exists"** → El dominio ya está en uso, cambia el nombre en `wrangler.toml`

**"Secret not found"** → Verifica que colocaste bien el secret: `wrangler secret list --env production`

---

¿Necesitas ayuda? 🤝
