# Abre o projeto no Expo Go ja instalado (nao instala nem altera nada no celular)
$ErrorActionPreference = "Continue"
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

$sdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$adb = "$sdkRoot\platform-tools\adb.exe"
$adbOk = $false
$lanIp = Get-LanIp

if (Test-Path $adb) {
  $device = & $adb devices 2>$null | Select-String "\tdevice$"
  if ($device) {
    & $adb reverse tcp:3000 tcp:3000 2>$null
    & $adb reverse tcp:8081 tcp:8081 2>$null
    $reverseList = & $adb reverse --list 2>$null
    if ($reverseList -match "tcp:3000") {
      $adbOk = $true
      Write-Host "USB OK: adb reverse ativo (127.0.0.1:3000 e :8081 no celular)." -ForegroundColor Green
    } else {
      Write-Host "USB: celular detectado, mas adb reverse falhou." -ForegroundColor Yellow
    }
  } else {
    Write-Host "Celular nao detectado via USB." -ForegroundColor Yellow
  }
} else {
  Write-Host "adb nao encontrado (Android SDK)." -ForegroundColor Yellow
}

if ($adbOk) {
  $env:EXPO_PUBLIC_API_URL = "http://127.0.0.1:3000/api"
  $env:REACT_NATIVE_PACKAGER_HOSTNAME = "127.0.0.1"
} elseif ($lanIp) {
  $env:EXPO_PUBLIC_API_URL = "http://${lanIp}:3000/api"
  Write-Host "Usando IP da rede: http://${lanIp}:3000/api" -ForegroundColor Cyan
  Write-Host "Celular e PC precisam estar na mesma Wi-Fi." -ForegroundColor DarkYellow
} else {
  Write-Host "Nao foi possivel configurar USB nem IP da rede." -ForegroundColor Red
  Write-Host "Use: npm run phone (Wi-Fi) ou conecte o USB com depuracao ativa." -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "=== Konekt Mobile ===" -ForegroundColor Green
Write-Host ""
Write-Host '1. API no PC: cd konekt-back; npm run dev' -ForegroundColor White
Write-Host "2. Abra o Expo Go no celular" -ForegroundColor White
Write-Host "3. Escaneie o QR Code deste terminal" -ForegroundColor White
Write-Host ""
Write-Host "A URL da API e detectada automaticamente pelo IP do Metro." -ForegroundColor Cyan
if ($lanIp -and -not $adbOk) {
  Write-Host "Se ainda der sem conexao, libere a porta 3000 no Firewall do Windows." -ForegroundColor DarkYellow
}
Write-Host ""

# USB usa adb reverse em 8081 — libera a porta se outro Metro estiver preso.
if ($adbOk) {
  $busy = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
  foreach ($conn in $busy) {
    $procId = $conn.OwningProcess
    if ($procId -and $procId -ne 0) {
      Write-Host "Liberando porta 8081 (PID $procId)..." -ForegroundColor DarkYellow
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      Start-Sleep -Seconds 1
    }
  }
}

$expoArgs = @("start", "--port", "8081")
if ($adbOk) {
  $expoArgs += "--localhost"
}
if ($args -contains "-c") {
  $expoArgs += "--clear"
}

& npx expo @expoArgs
