# Exige Node 20+ (Expo SDK 54)
$ErrorActionPreference = "Stop"

$nvmNodePath = "C:\nvm4w\nodejs"
if ((Test-Path "$nvmNodePath\node.exe") -and ($env:Path -notlike "*$nvmNodePath*")) {
  $env:Path = "$nvmNodePath;$env:Path"
}

$version = & node -v 2>$null
if (-not $version) {
  if (Get-Command nvm -ErrorAction SilentlyContinue) {
    $nvmrc = Join-Path (Get-Location) ".nvmrc"
    if (Test-Path $nvmrc) {
      $target = (Get-Content $nvmrc -Raw).Trim()
      if ($target) {
        Write-Host "Ativando Node $target via nvm..." -ForegroundColor Cyan
        nvm use $target 2>$null | Out-Null
        if ((Test-Path "$nvmNodePath\node.exe") -and ($env:Path -notlike "*$nvmNodePath*")) {
          $env:Path = "$nvmNodePath;$env:Path"
        }
        $version = & node -v 2>$null
      }
    }
  }
}

if (-not $version) {
  Write-Host ""
  Write-Host "Node.js nao encontrado no PATH." -ForegroundColor Red
  Write-Host "Com nvm: nvm install 22.23.1 && nvm use 22.23.1" -ForegroundColor Yellow
  Write-Host "Feche e reabra o terminal depois de trocar a versao." -ForegroundColor Yellow
  Write-Host ""
  exit 1
}

$major = [int]($version -replace '^v(\d+)\..*', '$1')
if ($major -lt 20) {
  Write-Host ""
  Write-Host "Node $version detectado. Expo SDK 54 exige Node 20+." -ForegroundColor Red
  Write-Host ""
  Write-Host "Rode em um terminal NOVO:" -ForegroundColor Yellow
  Write-Host "  nvm install 22.23.1" -ForegroundColor Cyan
  Write-Host "  nvm use 22.23.1" -ForegroundColor Cyan
  Write-Host "  node -v    (deve mostrar v22.x)" -ForegroundColor Cyan
  Write-Host ""
  exit 1
}

Write-Host "Node $version OK" -ForegroundColor Green
