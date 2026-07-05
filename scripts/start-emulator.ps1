$sdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$emulator = "$sdkRoot\emulator\emulator.exe"
$avdName = "Konekt_Pixel_7"

if (-not (Test-Path $emulator)) {
  Write-Host "SDK nao configurado. Rode primeiro: npm run setup:android" -ForegroundColor Red
  exit 1
}

Write-Host "Iniciando emulador Android ($avdName)..."
Start-Process -FilePath $emulator -ArgumentList "-avd", $avdName
