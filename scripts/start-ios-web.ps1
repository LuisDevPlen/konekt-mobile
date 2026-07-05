# Inicia versao web (preview iOS no Windows)
$ErrorActionPreference = "Stop"
$env:EXPO_PUBLIC_API_URL = "http://localhost:3000/api"
Set-Location (Join-Path $PSScriptRoot "..")
npx expo start --web
