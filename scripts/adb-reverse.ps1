# Redireciona portas do celular Android (USB) para o PC via adb reverse
param(
  [int[]]$Ports = @(3000, 8081)
)

$ErrorActionPreference = "Stop"
$sdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$adb = "$sdkRoot\platform-tools\adb.exe"

if (-not (Test-Path $adb)) {
  Write-Host ""
  Write-Host "ADB nao encontrado. Instale o Android SDK:" -ForegroundColor Red
  Write-Host '  cd konekt-mobile; npm run setup:android' -ForegroundColor Cyan
  Write-Host ""
  exit 1
}

& $adb wait-for-device 2>$null
$deviceLines = @(& $adb devices 2>$null | Select-Object -Skip 1 | Where-Object { $_.Trim() -ne "" })
$authorized = @($deviceLines | Select-String "\tdevice$")
$unauthorized = @($deviceLines | Select-String "\tunauthorized$")

if ($unauthorized.Count -gt 0) {
  Write-Host ""
  Write-Host "Celular conectado, mas NAO autorizado." -ForegroundColor Red
  Write-Host "Desbloqueie o celular e aceite 'Permitir depuracao USB' no popup." -ForegroundColor Yellow
  Write-Host "Depois rode o comando de novo." -ForegroundColor Yellow
  Write-Host ""
  exit 1
}

if ($authorized.Count -eq 0) {
  Write-Host ""
  Write-Host "Nenhum celular Android detectado via USB." -ForegroundColor Red
  Write-Host ""
  Write-Host "1. Conecte o cabo USB ao PC" -ForegroundColor White
  Write-Host "2. No celular: Configuracoes > Sobre > toque 7x em 'Versao' (modo desenvolvedor)" -ForegroundColor White
  Write-Host "3. Ative 'Depuracao USB' em Opcoes do desenvolvedor" -ForegroundColor White
  Write-Host "4. Aceite a autorizacao RSA no celular" -ForegroundColor White
  Write-Host "5. Rode: adb devices   (deve aparecer 'device')" -ForegroundColor White
  Write-Host ""
  exit 1
}

foreach ($port in $Ports) {
  & $adb reverse "tcp:${port}" "tcp:${port}" 2>$null
  Write-Host "adb reverse: celular localhost:${port} -> PC:${port}" -ForegroundColor Green
}
