const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const outputDir = path.join(rootDir, 'release-apks');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const javaHome = fs.existsSync("C:\\Users\\PC\\.jdks\\jbr-21.0.11")
  ? "C:\\Users\\PC\\.jdks\\jbr-21.0.11"
  : (fs.existsSync("C:\\Program Files\\Android\\Android Studio\\jbr")
      ? "C:\\Program Files\\Android\\Android Studio\\jbr"
      : process.env.JAVA_HOME);

process.env.JAVA_HOME = javaHome;
process.env.PATH = `${javaHome}\\bin;${process.env.PATH}`;
console.log(`☕ Usando JDK em: ${javaHome}`);

const buildGradlePath = path.join(androidDir, 'app', 'build.gradle');
const stringsXmlPath = path.join(androidDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const capConfigRoot = path.join(rootDir, 'capacitor.config.json');
const capConfigAssets = path.join(androidDir, 'app', 'src', 'main', 'assets', 'capacitor.config.json');

function setConfig({ appId, appName, url }) {
  console.log(`\n========================================`);
  console.log(`🔧 Configurando: ${appName} (${appId})`);
  console.log(`🌐 URL de Inicialização: ${url}`);
  console.log(`========================================`);

  // 1. Atualiza build.gradle com appId e versão 5.7.0
  let bg = fs.readFileSync(buildGradlePath, 'utf8');
  bg = bg.replace(/applicationId\s+["'][^"']+["']/, `applicationId "${appId}"`);
  bg = bg.replace(/versionCode\s+\d+/, `versionCode 570`);
  bg = bg.replace(/versionName\s+["'][^"']+["']/, `versionName "5.7.0"`);
  fs.writeFileSync(buildGradlePath, bg, 'utf8');

  // 2. Atualiza strings.xml
  let sx = fs.readFileSync(stringsXmlPath, 'utf8');
  sx = sx.replace(/<string name="app_name">[^<]+<\/string>/, `<string name="app_name">${appName}</string>`);
  sx = sx.replace(/<string name="title_activity_main">[^<]+<\/string>/, `<string name="title_activity_main">${appName}</string>`);
  sx = sx.replace(/<string name="package_name">[^<]+<\/string>/, `<string name="package_name">${appId}</string>`);
  sx = sx.replace(/<string name="custom_url_scheme">[^<]+<\/string>/, `<string name="custom_url_scheme">${appId}</string>`);
  fs.writeFileSync(stringsXmlPath, sx, 'utf8');

  // 3. Atualiza capacitor.config.json (root e assets)
  const capData = {
    appId,
    appName,
    webDir: "public",
    server: {
      url,
      cleartext: false,
      androidScheme: "https",
      allowNavigation: [
        "arenalimoeiro.vercel.app",
        "*.arenalimoeiro.vercel.app",
        "brmclyukjfijommbxhks.supabase.co",
        "*.supabase.co"
      ]
    },
    plugins: {
      SplashScreen: {
        launchShowDuration: 2500,
        launchAutoHide: true,
        backgroundColor: "#ffffff",
        androidSplashResourceName: "splash",
        androidScaleType: "CENTER_CROP",
        showSpinner: false
      }
    }
  };

  const capStr = JSON.stringify(capData, null, 2);
  fs.writeFileSync(capConfigRoot, capStr, 'utf8');
  fs.writeFileSync(capConfigAssets, capStr, 'utf8');
}

function buildApk(targetApkName, isControle = false) {
  console.log(`🚀 Compilando APK Release via Gradle: ${targetApkName}...`);
  execSync('.\\gradlew.bat assembleRelease --no-daemon', {
    cwd: androidDir,
    stdio: 'inherit',
    env: process.env
  });

  const apkSource = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  const apkDest = path.join(outputDir, targetApkName);

  if (!fs.existsSync(apkSource)) {
    throw new Error(`APK gerado não encontrado em: ${apkSource}`);
  }

  // 1. release-apks/
  fs.copyFileSync(apkSource, apkDest);
  const sizeMb = (fs.statSync(apkDest).size / (1024 * 1024)).toFixed(2);
  console.log(`✅ APK criado com sucesso: ${apkDest} (${sizeMb} MB)`);

  // 2. public/apks/
  const publicApksDir = path.join(rootDir, 'public', 'apks');
  if (!fs.existsSync(publicApksDir)) fs.mkdirSync(publicApksDir, { recursive: true });
  fs.copyFileSync(apkSource, path.join(publicApksDir, targetApkName));
  console.log(`   └─ Copiado para: ${path.join(publicApksDir, targetApkName)}`);

  // 3. Se for controle, copia também para public/arena-limoeiro-controle.apk
  if (isControle) {
    const rootControleApk = path.join(rootDir, 'public', 'arena-limoeiro-controle.apk');
    fs.copyFileSync(apkSource, rootControleApk);
    console.log(`   └─ Copiado para: ${rootControleApk}`);
  }

  // 4. apks/ folder no root
  const rootApksDir = path.join(rootDir, 'apks');
  if (!fs.existsSync(rootApksDir)) fs.mkdirSync(rootApksDir, { recursive: true });
  const altName = isControle ? 'ARENA_LIMOEIRO_CONTROLE.apk' : 'ARENA_LIMOEIRO.apk';
  fs.copyFileSync(apkSource, path.join(rootApksDir, targetApkName));
  fs.copyFileSync(apkSource, path.join(rootApksDir, altName));

  // 5. Desktop do usuário
  const desktopDir = "C:\\Users\\PC\\Desktop";
  if (fs.existsSync(desktopDir)) {
    try {
      fs.copyFileSync(apkSource, path.join(desktopDir, targetApkName));
      fs.copyFileSync(apkSource, path.join(desktopDir, altName));
      console.log(`   └─ Copiado para Desktop: ${altName} e ${targetApkName}`);
    } catch (e) {
      console.warn("   ⚠️ Aviso ao copiar para Desktop:", e.message);
    }
  }
}

async function main() {
  try {
    // 1. Sincroniza web assets atualizados para o Android
    console.log("📦 Copiando web assets atualizados para android/app/src/main/assets/public/...");
    const publicDir = path.join(rootDir, 'public');
    const publicAssetsDir = path.join(androidDir, 'app', 'src', 'main', 'assets', 'public');
    if (!fs.existsSync(publicAssetsDir)) fs.mkdirSync(publicAssetsDir, { recursive: true });

    const files = fs.readdirSync(publicDir);
    for (const f of files) {
      if (f.endsWith('.apk') || f === 'apks') continue;
      const src = path.join(publicDir, f);
      const dst = path.join(publicAssetsDir, f);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dst);
      }
    }

    // 2. Build APK 1: Cliente
    setConfig({
      appId: "com.arenalimoeiro.cliente",
      appName: "Arena Limoeiro",
      url: "https://arenalimoeiro.vercel.app?app=apk_cliente"
    });
    buildApk("ArenaLimoeiro-Cliente.apk", false);

    // 3. Build APK 2: Controle
    setConfig({
      appId: "com.arenalimoeiro.controle",
      appName: "Arena Controle",
      url: "https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth?app=apk_controle"
    });
    buildApk("ArenaLimoeiro-Controle.apk", true);

    console.log("\n🎉 CONCLUÍDO COM SUCESSO!");
    console.log("Os 2 APKs v5.6.2 foram gerados e sincronizados:");
    console.log("  1. ArenaLimoeiro-Cliente.apk  -> https://arenalimoeiro.vercel.app/");
    console.log("  2. ArenaLimoeiro-Controle.apk -> https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth");
    console.log("  3. Disponíveis para download direto pelo site ou pelo Desktop.");

  } catch (err) {
    console.error("❌ Erro durante a geração dos APKs:", err);
    process.exit(1);
  }
}

main();
