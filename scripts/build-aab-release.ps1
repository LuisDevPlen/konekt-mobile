# Gera o Android App Bundle (.aab) de release do Dino Eats Mobile, assinado
# com a keystore de upload em android-release/, para publicar na Play Store.
# Compila fora do OneDrive e copia o resultado para dist\dinoeats-mobile-release.aab.

$ErrorActionPreference = "Stop"

$Source = (Resolve-Path (Split-Path -Parent $PSScriptRoot)).Path
$BuildRoot = "C:\konekt-mobile-build"
$ExpectedBuildRoot = [System.IO.Path]::GetFullPath($BuildRoot)

function Remove-LocalBuild {
  if (-not (Test-Path -LiteralPath $BuildRoot)) {
    return
  }

  $ResolvedBuildRoot = (Resolve-Path -LiteralPath $BuildRoot).Path
  if (
    $ResolvedBuildRoot -ne $ExpectedBuildRoot -or
    $ResolvedBuildRoot -eq [System.IO.Path]::GetPathRoot($ResolvedBuildRoot)
  ) {
    throw "Pasta de build insegura para limpeza: $ResolvedBuildRoot"
  }

  Write-Host ">> Limpando $ResolvedBuildRoot ..." -ForegroundColor Yellow
  Remove-Item -LiteralPath $ResolvedBuildRoot -Recurse -Force
}

function Read-SigningProperties {
  $PropsPath = Join-Path $Source "android-release\release-signing.properties"
  if (-not (Test-Path -LiteralPath $PropsPath)) {
    throw "Arquivo de assinatura nao encontrado: $PropsPath. Gere a keystore de upload primeiro."
  }

  $Props = @{}
  Get-Content -LiteralPath $PropsPath | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
      $Props[$Matches[1].Trim()] = $Matches[2].Trim()
    }
  }
  return $Props
}

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:GRADLE_USER_HOME = "C:\g"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

# Valores incorporados ao bundle.
$env:EXPO_PUBLIC_API_URL = "https://api.dinoeats.com.br/api"
$env:EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = "630358177762-21rdhck17psdgtk9vd4rafomo1vc9134.apps.googleusercontent.com"
$env:EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = "630358177762-0s7vn3h57l2feel8i3p3vabem1m4b49k.apps.googleusercontent.com"
$env:EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = "630358177762-ermgfja5ki9699fa56s64dftl87maoqn.apps.googleusercontent.com"

if (-not (Test-Path -LiteralPath "$env:JAVA_HOME\bin\java.exe")) {
  throw "JAVA_HOME invalido: $env:JAVA_HOME"
}
if (-not (Test-Path -LiteralPath $env:ANDROID_HOME)) {
  throw "Android SDK nao encontrado: $env:ANDROID_HOME"
}

$SigningProps = Read-SigningProperties
# O plugin de assinatura le RELEASE_STORE_FILE relativo ao BuildRoot (copia do projeto).
$env:RELEASE_STORE_FILE = Join-Path $BuildRoot $SigningProps["storeFile"]
$env:RELEASE_STORE_PASSWORD = $SigningProps["storePassword"]
$env:RELEASE_KEY_ALIAS = $SigningProps["keyAlias"]
$env:RELEASE_KEY_PASSWORD = $SigningProps["keyPassword"]

Write-Host ">> API de producao: $env:EXPO_PUBLIC_API_URL" -ForegroundColor Cyan
Write-Host ">> Origem: $Source" -ForegroundColor Cyan
Write-Host ">> Build local: $BuildRoot" -ForegroundColor Cyan

Remove-LocalBuild
New-Item -ItemType Directory -Path $BuildRoot | Out-Null

Write-Host ">> Copiando projeto..." -ForegroundColor Cyan
robocopy $Source $BuildRoot /E `
  /XD "$Source\node_modules" "$Source\android" "$Source\.expo" "$Source\.git" "$Source\dist" `
  /XF "$Source\scripts\cmdline-tools.zip" "$Source\scripts\expo-go.apk" `
  /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
$RobocopyExitCode = $LASTEXITCODE
if ($RobocopyExitCode -ge 8) {
  throw "Falha ao copiar o projeto (robocopy=$RobocopyExitCode)"
}

if (-not (Test-Path -LiteralPath $env:RELEASE_STORE_FILE)) {
  throw "Keystore de release nao encontrada apos a copia: $env:RELEASE_STORE_FILE"
}

Push-Location $BuildRoot
try {
  Write-Host ">> Instalando dependencias..." -ForegroundColor Cyan
  $env:NODE_ENV = "development"
  npm ci --include=dev --no-fund --no-audit
  if ($LASTEXITCODE -ne 0) {
    throw "npm ci falhou"
  }

  Write-Host ">> Gerando projeto Android..." -ForegroundColor Cyan
  $env:NODE_ENV = "production"
  npx expo prebuild --platform android --clean --no-install
  if ($LASTEXITCODE -ne 0) {
    throw "expo prebuild falhou"
  }

  $GradleWrapper = Join-Path $BuildRoot "android\gradlew.bat"
  if (-not (Test-Path -LiteralPath $GradleWrapper)) {
    throw "Gradle wrapper nao encontrado: $GradleWrapper"
  }

  Set-Location (Join-Path $BuildRoot "android")
  Write-Host ">> Gerando AAB release..." -ForegroundColor Cyan
  & $GradleWrapper bundleRelease `
    --max-workers=1 `
    -x lintVitalAnalyzeRelease
  if ($LASTEXITCODE -ne 0) {
    throw "gradle bundleRelease falhou"
  }
}
finally {
  Pop-Location
}

$Aab = Join-Path $BuildRoot "android\app\build\outputs\bundle\release\app-release.aab"
if (-not (Test-Path -LiteralPath $Aab)) {
  throw "AAB nao encontrado: $Aab"
}

$DestinationDirectory = Join-Path $Source "dist"
New-Item -ItemType Directory -Force -Path $DestinationDirectory | Out-Null
$DestinationAab = Join-Path $DestinationDirectory "dinoeats-mobile-release.aab"
Copy-Item -LiteralPath $Aab -Destination $DestinationAab -Force

Write-Host ""
Write-Host "AAB gerado com sucesso:" -ForegroundColor Green
Write-Host $DestinationAab -ForegroundColor Green
