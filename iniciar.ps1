# Script PowerShell para iniciar el servidor de Estudio Giménez con la API Key de Fabián

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

Write-Host ""
Write-Host "🔑 Configurando API Key..." -ForegroundColor Green
Write-Host "✅ API Key recibida: $($ApiKey.Substring(0, 20))..." -ForegroundColor Cyan

$env:ANTHROPIC_API_KEY = $ApiKey
node server.js
