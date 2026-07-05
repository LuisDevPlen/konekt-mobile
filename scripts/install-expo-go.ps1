# Instala Expo Go no Android conectado (celular fisico ou emulador)
param(
  [switch]$SkipDownload
)

$ErrorActionPreference = "Stop"
$sdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$adb = "$sdkRoot\platform-tools\adb.exe"
$apk = Join-Path $PSScriptRoot "expo-go.apk"
$expoGoPackage = "host.exp.exponent"
$expoGoApkUrl = "https://github.com/expo/expo-go-releases/releases/download/Expo-Go-2.32.18/Expo-Go-2.32.18.apk"

if (-not (Test-Path $adb)) {
  Write-Host ""
  Write-Host "ADB nao encontrado. Rode: npm run setup:android" -ForegroundColor Red
  Write-Host ""
  exit 1
}

& $adb wait-for-device 2>$null
$devices = @(& $adb devices 2>$null | Select-String "\tdevice$")
if ($devices.Count -eq 0) {
  Write-Host ""
  Write-Host "Nenhum dispositivo Android conectado." -ForegroundColor Red
  Write-Host "Conecte o celular por USB, ative Depuracao USB e aceite a autorizacao." -ForegroundColor Yellow
  Write-Host ""
  exit 1
}

$installed = (& $adb shell pm list packages host.exp.exponent 2>$null | Out-String).Trim()
if ($installed -match 'host\.exp\.exponent') {
  Write-Host "Expo Go ja esta instalado no dispositivo." -ForegroundColor Green
  exit 0
}

if (-not $SkipDownload) {
  if (-not (Test-Path $apk) -or (Get-Item $apk).Length -lt 50000000) {
    Write-Host "Baixando Expo Go (~90MB)..." -ForegroundColor Cyan
    curl.exe -L -o $apk $expoGoApkUrl
    if (-not (Test-Path $apk) -or (Get-Item $apk).Length -lt 50000000) {
      Write-Host "Falha ao baixar o APK. Instale manualmente pela Play Store: Expo Go" -ForegroundColor Red
      exit 1
    }
  }
}

Write-Host "Instalando Expo Go no dispositivo..." -ForegroundColor Cyan
& $adb install -r $apk
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Falha ao instalar o APK." -ForegroundColor Red
  Write-Host "Alternativa: instale 'Expo Go' pela Google Play Store no celular." -ForegroundColor Yellow
  Write-Host ""
  exit 1
}

Write-Host "Expo Go instalado com sucesso!" -ForegroundColor Green
