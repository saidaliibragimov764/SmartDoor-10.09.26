$ErrorActionPreference = "Stop"

Set-Location -Path (Split-Path -Parent $PSScriptRoot)

if (-not (Test-Path -Path "dist\index.html")) {
  Write-Host "dist/ topilmadi. Avval build qiling: npm run build"
  exit 1
}

Write-Host "Starting server (http://localhost:8787) ..."
npm run start

