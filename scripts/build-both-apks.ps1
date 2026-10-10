$ErrorActionPreference = "Stop"
$env:JAVA_HOME = "C:\Users\PC\.jdks\jbr-21.0.11"
$baseDir = "C:\Users\PC\.gemini\antigravity\scratch\arena-booking-system"
Set-Location $baseDir

$utf8NoBom = New-Object System.Text.UTF8Encoding $false

if (!(Test-Path "$baseDir\apks")) {
    New-Item -ItemType Directory -Force -Path "$baseDir\apks" | Out-Null
}

# Limpar APKs anteriores da pasta de destino para evitar cópias antigas
Remove-Item "$baseDir\apks\*.apk" -ErrorAction SilentlyContinue

Write-Host "=========================================="
Write-Host "1. CONSTRUINDO APK CLIENTE (ARENA LIMOEIRO)"
Write-Host "=========================================="

# 1. Configurar capacitor.config.json para Cliente
$configClient = @'
{
  "appId": "com.arenalimoeiro.app",
  "appName": "ARENA LIMOEIRO",
  "webDir": "public",
  "server": {
    "url": "https://arenalimoeiro.vercel.app",
    "cleartext": false,
    "androidScheme": "https",
    "allowNavigation": [
      "arenalimoeiro.vercel.app",
      "*.arenalimoeiro.vercel.app",
      "brmclyukjfijommbxhks.supabase.co",
      "*.supabase.co"
    ]
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2500,
      "launchAutoHide": true,
      "backgroundColor": "#ffffff",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false
    }
  }
}
'@
[System.IO.File]::WriteAllText("$baseDir\capacitor.config.json", $configClient, $utf8NoBom)

# Strings.xml para Cliente
$stringsClient = @'
<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">ARENA LIMOEIRO</string>
    <string name="title_activity_main">ARENA LIMOEIRO</string>
    <string name="package_name">com.arenalimoeiro.app</string>
    <string name="custom_url_scheme">com.arenalimoeiro.app</string>
</resources>
'@
[System.IO.File]::WriteAllText("$baseDir\android\app\src\main\res\values\strings.xml", $stringsClient, $utf8NoBom)

# build.gradle para Cliente
$gradleContent = [System.IO.File]::ReadAllText("$baseDir\android\app\build.gradle")
$gradleContent = $gradleContent.TrimStart([char]0xfeff)
$gradleContent = $gradleContent -replace 'applicationId "com\.arenalimoeiro\.[^"]+"', 'applicationId "com.arenalimoeiro.app"'
[System.IO.File]::WriteAllText("$baseDir\android\app\build.gradle", $gradleContent, $utf8NoBom)

# Limpar app-debug.apk anterior se houver
Remove-Item "$baseDir\android\app\build\outputs\apk\debug\app-debug.apk" -ErrorAction SilentlyContinue

# Sync e Build Cliente
Write-Host "Sincronizando Capacitor Cliente..."
& npx.cmd cap sync android
if ($LASTEXITCODE -ne 0) { throw "Falha no cap sync android do Cliente" }

Write-Host "Compilando Gradle Cliente..."
& .\android\gradlew.bat -p android assembleDebug --no-daemon --max-workers=1
if ($LASTEXITCODE -ne 0) { throw "Falha no assembleDebug do Cliente" }

# Copiar APK Cliente
if (!(Test-Path "$baseDir\android\app\build\outputs\apk\debug\app-debug.apk")) {
    throw "Arquivo app-debug.apk não encontrado após o build do Cliente!"
}
Copy-Item "$baseDir\android\app\build\outputs\apk\debug\app-debug.apk" -Destination "$baseDir\apks\ARENA_LIMOEIRO.apk" -Force
Write-Host "-> APK Cliente gerado com sucesso em: apks\ARENA_LIMOEIRO.apk"

Write-Host "=========================================="
Write-Host "2. CONSTRUINDO APK CONTROLE (ARENA LIMOEIRO CONTROLE)"
Write-Host "=========================================="

# Configurar capacitor.config.json para Controle
$configControle = @'
{
  "appId": "com.arenalimoeiro.controle",
  "appName": "ARENA LIMOEIRO CONTROLE",
  "webDir": "public",
  "server": {
    "url": "https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth",
    "cleartext": false,
    "androidScheme": "https",
    "allowNavigation": [
      "arenalimoeiro.vercel.app",
      "*.arenalimoeiro.vercel.app",
      "brmclyukjfijommbxhks.supabase.co",
      "*.supabase.co"
    ]
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2500,
      "launchAutoHide": true,
      "backgroundColor": "#ffffff",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false
    }
  }
}
'@
[System.IO.File]::WriteAllText("$baseDir\capacitor.config.json", $configControle, $utf8NoBom)

# Strings.xml para Controle
$stringsControle = @'
<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">ARENA LIMOEIRO CONTROLE</string>
    <string name="title_activity_main">ARENA LIMOEIRO CONTROLE</string>
    <string name="package_name">com.arenalimoeiro.controle</string>
    <string name="custom_url_scheme">com.arenalimoeiro.controle</string>
</resources>
'@
[System.IO.File]::WriteAllText("$baseDir\android\app\src\main\res\values\strings.xml", $stringsControle, $utf8NoBom)

# build.gradle para Controle
$gradleContent = [System.IO.File]::ReadAllText("$baseDir\android\app\build.gradle")
$gradleContent = $gradleContent.TrimStart([char]0xfeff)
$gradleContent = $gradleContent -replace 'applicationId "com\.arenalimoeiro\.[^"]+"', 'applicationId "com.arenalimoeiro.controle"'
[System.IO.File]::WriteAllText("$baseDir\android\app\build.gradle", $gradleContent, $utf8NoBom)

# Limpar app-debug.apk anterior
Remove-Item "$baseDir\android\app\build\outputs\apk\debug\app-debug.apk" -ErrorAction SilentlyContinue

# Sync e Build Controle
Write-Host "Sincronizando Capacitor Controle..."
& npx.cmd cap sync android
if ($LASTEXITCODE -ne 0) { throw "Falha no cap sync android do Controle" }

Write-Host "Compilando Gradle Controle..."
& .\android\gradlew.bat -p android assembleDebug --no-daemon --max-workers=1
if ($LASTEXITCODE -ne 0) { throw "Falha no assembleDebug do Controle" }

# Copiar APK Controle
if (!(Test-Path "$baseDir\android\app\build\outputs\apk\debug\app-debug.apk")) {
    throw "Arquivo app-debug.apk não encontrado após o build do Controle!"
}
Copy-Item "$baseDir\android\app\build\outputs\apk\debug\app-debug.apk" -Destination "$baseDir\apks\ARENA_LIMOEIRO_CONTROLE.apk" -Force
Write-Host "-> APK Controle gerado com sucesso em: apks\ARENA_LIMOEIRO_CONTROLE.apk"

Write-Host "=========================================="
Write-Host "AMBOS OS APKS FORAM GERADOS COM SUCESSO!"
Write-Host "=========================================="
Copy-Item "$baseDir\apks\ARENA_LIMOEIRO.apk" "C:\Users\PC\Desktop\ARENA_LIMOEIRO.apk" -Force
Copy-Item "$baseDir\apks\ARENA_LIMOEIRO_CONTROLE.apk" "C:\Users\PC\Desktop\ARENA_LIMOEIRO_CONTROLE.apk" -Force
Write-Host "-> Copiados para a Área de Trabalho (Desktop)!"
Get-Item "$baseDir\apks\*.apk", "C:\Users\PC\Desktop\ARENA_LIMOEIRO*.apk" | Select-Object Name, Length, LastWriteTime, FullName
