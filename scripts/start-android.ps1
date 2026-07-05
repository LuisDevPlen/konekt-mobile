# Inicia emulador (se necessario) e abre o app no Android
$ErrorActionPreference = "Stop"
& "$PSScriptRoot\preview-both.ps1"
Set-Location (Join-Path $PSScriptRoot "..")
$expoArgs = @("start", "--android")
if ($args -contains "-c") { $expoArgs += "--clear" }
npx expo @expoArgs