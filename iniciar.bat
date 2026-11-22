@echo off
REM Script para iniciar el servidor de Estudio Giménez con la API Key de Fabián

if "%1"=="" (
    echo.
    echo ❌ Error: Debes pasar tu API key como argumento
    echo.
    echo Uso: iniciar.bat sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    echo.
    echo Ejemplo:
    echo   iniciar.bat sk-ant-1234567890abcdefghijklmnopqrstuv
    echo.
    exit /b 1
)

echo.
echo 🔑 Configurando API Key...
echo ✅ API Key recibida: %1

set ANTHROPIC_API_KEY=%1
node server.js

pause
