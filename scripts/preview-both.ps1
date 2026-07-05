# Inicia emulador Android + Expo (use em outro terminal: npm run ios-preview)
$ErrorActionPreference = "Stop"
$sdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$emulator = "$sdkRoot\emulator\emulator.exe"
$adb = "$sdkRoot\platform-tools\adb.exe"

if (-not (Test-Path $emulator)) {
  Write-Host "SDK nao configurado. Rode: npm run setup:android" -ForegroundColor Red
  exit 1
}

$running = & $adb devices 2>$null | Select-String "emulator"
if (-not $running) {
  Write-Host "Iniciando emulador Android..."
  Start-Process -FilePath $emulator -ArgumentList "-avd", "Konekt_Pixel_7"
  & $adb wait-for-device
  Start-Sleep -Seconds 8
}

if (Test-Path $adb) {
  & $adb wait-for-device 2>$null
  & $adb reverse tcp:3000 tcp:3000 2>$null
  Write-Host "adb reverse: emulador localhost:3000 -> PC:3000" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Preview Android + iOS (Windows) ===" -ForegroundColor Cyan
Write-Host "1. Este terminal: Expo vai abrir para ANDROID (emulador)"
Write-Host "2. Outro terminal: npm run ios-preview  (simula iPhone no navegador)"
Write-Host ""
