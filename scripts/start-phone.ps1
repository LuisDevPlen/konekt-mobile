# Inicia o Expo para testar no celular fisico (mesma rede Wi-Fi do PC)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

# ensure-node usa `exit 1` em falha (encerra o processo). Em sucesso, segue.
& "$PSScriptRoot\ensure-node.ps1"

function Get-LanIp {
  $candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notlike '127.*' -and
      $_.PrefixOrigin -ne 'WellKnown' -and
      ($_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' -or $_.IPAddress -like '172.1[6-9].*' -or $_.IPAddress -like '172.2[0-9].*' -or $_.IPAddress -like '172.3[0-1].*')
    } |
    Sort-Object -Property InterfaceMetric

  if ($candidates) {
    return ($candidates | Select-Object -First 1).IPAddress
  }

  return $null
}

$lanIp = Get-LanIp
if (-not $lanIp) {
  Write-Host ""
  Write-Host "Nao foi possivel detectar o IP da rede local." -ForegroundColor Yellow
  Write-Host "Defina manualmente no .env:" -ForegroundColor Yellow
  Write-Host "  EXPO_PUBLIC_API_URL=http://SEU_IP:3000/api" -ForegroundColor Cyan
  Write-Host ""
  exit 1
}

$apiUrl = "http://${lanIp}:3000/api"
$env:EXPO_PUBLIC_API_URL = $apiUrl

Write-Host ""
Write-Host "=== Konekt Mobile — celular fisico ===" -ForegroundColor Green
Write-Host ""
Write-Host "1. Celular e PC na mesma rede Wi-Fi" -ForegroundColor White
Write-Host '2. API rodando: cd konekt-back; npm run dev' -ForegroundColor White
Write-Host "3. Instale o Expo Go no celular" -ForegroundColor White
Write-Host "4. Escaneie o QR Code abaixo (Android: Expo Go / iOS: Camera)" -ForegroundColor White
Write-Host ""
Write-Host "API URL inicial: $apiUrl" -ForegroundColor Cyan
Write-Host "No celular, a URL final e detectada automaticamente pelo IP do Metro." -ForegroundColor DarkGray
Write-Host ""
Write-Host "Se a API nao responder no celular:" -ForegroundColor DarkYellow
Write-Host "  npm run firewall:api   (libera porta 3000 no Windows)" -ForegroundColor DarkYellow
Write-Host ""

$expoArgs = @("start")
if ($args -contains "-c") { $expoArgs += "--clear" }
if ($args -contains "--tunnel") { $expoArgs += "--tunnel" }

& npx expo @expoArgs
