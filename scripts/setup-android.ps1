# Configura Android SDK + emulador (rode uma vez)
$ErrorActionPreference = "Stop"

$studioJbr = "C:\Program Files\Android\Android Studio\jbr"
$sdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$cmdlineZip = "$env:TEMP\cmdline-tools.zip"
$cmdlineDir = "$sdkRoot\cmdline-tools"
$latestDir = "$cmdlineDir\latest"

if (-not (Test-Path $studioJbr)) {
  Write-Host "Android Studio nao encontrado. Instale: winget install Google.AndroidStudio" -ForegroundColor Red
  exit 1
}

$env:JAVA_HOME = $studioJbr
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:Path = "$studioJbr\bin;$sdkRoot\platform-tools;$sdkRoot\emulator;$latestDir\bin;$env:Path"

New-Item -ItemType Directory -Force -Path $sdkRoot | Out-Null

if (-not (Test-Path "$latestDir\bin\sdkmanager.bat")) {
  $localZip = Join-Path $PSScriptRoot "cmdline-tools.zip"
  if (-not (Test-Path $localZip) -or (Get-Item $localZip).Length -lt 140000000) {
    Write-Host "Baixando Android command-line tools (~150MB)..."
    $url = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    curl.exe -L -o $localZip $url
  } else {
    Write-Host "Usando download local em scripts/cmdline-tools.zip"
  }
  Write-Host "Extraindo..."
  New-Item -ItemType Directory -Force -Path $latestDir | Out-Null
  tar -xf $localZip -C $latestDir
  if (Test-Path "$latestDir\cmdline-tools") {
    Get-ChildItem "$latestDir\cmdline-tools" | Move-Item -Destination $latestDir -Force
    Remove-Item "$latestDir\cmdline-tools" -Recurse -Force
  }
}

Write-Host "Instalando pacotes SDK (pode demorar alguns minutos)..."
$packages = @(
  "platform-tools",
  "emulator",
  "platforms;android-34",
  "system-images;android-34;google_apis_playstore;x86_64"
)
foreach ($pkg in $packages) {
  & "$latestDir\bin\sdkmanager.bat" --sdk_root=$sdkRoot $pkg
}

Write-Host "Aceitando licencas..."
cmd /c "echo y | `"$latestDir\bin\sdkmanager.bat`" --sdk_root=$sdkRoot --licenses"

$avdName = "Konekt_Pixel_7"
$avds = & "$latestDir\bin\avdmanager.bat" list avd 2>$null
if ($avds -notmatch $avdName) {
  Write-Host "Criando emulador $avdName..."
  echo "no" | & "$latestDir\bin\avdmanager.bat" create avd -n $avdName -k "system-images;android-34;google_apis_playstore;x86_64" -d "pixel_7"
}

# Variaveis de usuario permanentes
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkRoot, "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $sdkRoot, "User")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$toAdd = @(
  "$sdkRoot\platform-tools",
  "$sdkRoot\emulator",
  "$latestDir\bin"
)
foreach ($p in $toAdd) {
  if ($userPath -notlike "*$p*") { $userPath = "$userPath;$p" }
}
[Environment]::SetEnvironmentVariable("Path", $userPath, "User")

Write-Host ""
Write-Host "Pronto! Emulador: $avdName" -ForegroundColor Green
Write-Host "Reabra o terminal e rode: npm run emulator" -ForegroundColor Green
