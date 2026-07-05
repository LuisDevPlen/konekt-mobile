# Libera a porta 3000 (API Konekt) no Firewall do Windows para o celular na mesma rede

$ErrorActionPreference = "Stop"



$ruleName = "Konekt API (porta 3000)"



$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

if ($existing) {

  Write-Host "Regra de firewall ja existe: $ruleName" -ForegroundColor Green

  exit 0

}



Write-Host "Criando regra de firewall para a API na porta 3000..." -ForegroundColor Cyan

New-NetFirewallRule `

  -DisplayName $ruleName `

  -Direction Inbound `

  -Action Allow `

  -Protocol TCP `

  -LocalPort 3000 `

  -Profile Private, Domain | Out-Null



Write-Host "Pronto. Celulares na mesma rede Wi-Fi podem acessar a API." -ForegroundColor Green

