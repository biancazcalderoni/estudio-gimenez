# 🚀 Estudio Jurídico Giménez - Configuración

## Paso 1: Obtén tu API Key de Fabián

1. Ve a https://console.anthropic.com/
2. Loguéate con la cuenta de Fabián
3. Ve a **Settings** → **API Keys**
4. Haz click en **Create Key**
5. Dale un nombre (ej: "Estudio Giménez")
6. **Copia la key** (empieza con `sk-ant-`)

## Paso 2: Inicia el servidor

### Opción A: Command Prompt (CMD)

```bash
iniciar.bat sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Reemplaza `sk-ant-...` con la key de Fabián.

### Opción B: PowerShell

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\iniciar.ps1 -ApiKey "sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Opción C: Terminal (Bash/WSL)

```bash
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx node server.js
```

## Paso 3: Accede a la aplicación

Una vez que veas el mensaje:
```
✅ Servidor iniciado en http://localhost:3000
🔑 API Key configurada: sk-ant-xxxxx...
```

Abre tu navegador en: **http://localhost:3000**

## 🔐 Seguridad

- ✅ La API Key **NO se guarda** en archivos
- ✅ **NO aparece** en el código fuente
- ✅ Se pasa como **variable de entorno**
- ✅ Se inyecta en memoria cuando inicia el servidor
- ⚠️ **Nunca** la compartas por email o chat

## 📋 Requisitos

- Node.js 14+ instalado
- La API Key de Fabián desde Anthropic

## ❌ Problemas comunes

**"node: no encontrado"** → Instala Node.js desde https://nodejs.org

**"ANTHROPIC_API_KEY no está configurada"** → Verifica que pasaste la key correctamente

**"Puerto 3000 ya está en uso"** → Cierra otra aplicación que use ese puerto

---

¿Listo? 🎯
