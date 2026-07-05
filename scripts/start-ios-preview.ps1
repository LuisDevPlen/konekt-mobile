# Abre preview estilo iOS no Windows (via Responsively App ou Chrome)
$ErrorActionPreference = "SilentlyContinue"

$responsivelyPaths = @(
  "$env:LOCALAPPDATA\Programs\ResponsivelyApp\ResponsivelyApp.exe",
  "$env:ProgramFiles\ResponsivelyApp\ResponsivelyApp.exe"
)

$opened = $false
foreach ($p in $responsivelyPaths) {
  if (Test-Path $p) {
    Start-Process $p "http://localhost:8081"
    $opened = $true
    Write-Host "Responsively aberto — selecione iPhone 14 no painel esquerdo" -ForegroundColor Green
    break
  }
}

if (-not $opened) {
  Write-Host "Abrindo Chrome em modo iPhone..."
  $chrome = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"
  if (Test-Path $chrome) {
    Start-Process $chrome "--new-window --auto-open-devtools-for-tabs http://localhost:8081"
    Write-Host "No Chrome: F12 > icone celular > iPhone 14 Pro" -ForegroundColor Yellow
  } else {
    Start-Process "http://localhost:8081"
    Write-Host "Abra http://localhost:8081 e use modo celular do navegador (iPhone)" -ForegroundColor Yellow
  }
}
