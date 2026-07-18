# Reaplica adb reverse da API (3000) e Metro (8081) sem reiniciar o Expo.
$ErrorActionPreference = "Continue"
$sdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$adb = "$sdkRoot\platform-tools\adb.exe"

if (-not (Test-Path $adb)) {
  Write-Host "adb nao encontrado em $adb" -ForegroundColor Red
  exit 1
}

$device = & $adb devices 2>$null | Select-String "\tdevice$"
if (-not $device) {
  Write-Host "Nenhum celular USB conectado (depuração USB ativa?)." -ForegroundColor Red
  exit 1
}

& $adb reverse tcp:3000 tcp:3000
& $adb reverse tcp:8081 tcp:8081

Write-Host ""
Write-Host "adb reverse ativo:" -ForegroundColor Green
& $adb reverse --list
Write-Host ""
Write-Host "Teste no celular: toque em Tentar novamente no app." -ForegroundColor Cyan
