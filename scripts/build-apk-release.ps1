# Gera o APK release do Dino Eats Mobile sem depender de login no Expo/EAS.
# Compila fora do OneDrive e copia o resultado para dist\dinoeats-mobile-release.apk.

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

$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:GRADLE_USER_HOME = "C:\g"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

# Valores incorporados ao bundle do APK.
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
  Write-Host ">> Gerando APK release (arm64-v8a)..." -ForegroundColor Cyan
  & $GradleWrapper assembleRelease `
    --max-workers=1 `
    -PreactNativeArchitectures=arm64-v8a `
    -x lintVitalAnalyzeRelease
  if ($LASTEXITCODE -ne 0) {
    throw "gradle assembleRelease falhou"
  }
}
finally {
  Pop-Location
}

$Apk = Join-Path $BuildRoot "android\app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path -LiteralPath $Apk)) {
  throw "APK nao encontrado: $Apk"
}

$DestinationDirectory = Join-Path $Source "dist"
New-Item -ItemType Directory -Force -Path $DestinationDirectory | Out-Null
$DestinationApk = Join-Path $DestinationDirectory "dinoeats-mobile-release.apk"
Copy-Item -LiteralPath $Apk -Destination $DestinationApk -Force

Write-Host ""
Write-Host "APK gerado com sucesso:" -ForegroundColor Green
Write-Host $DestinationApk -ForegroundColor Green
