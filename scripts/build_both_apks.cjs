const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const outputDir = path.join(rootDir, 'release-apks');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const javaHome = "C:\\Program Files\\Android\\Android Studio\\jbr";
process.env.JAVA_HOME = javaHome;
process.env.PATH = `${javaHome}\\bin;${process.env.PATH}`;

const buildGradlePath = path.join(androidDir, 'app', 'build.gradle');
const stringsXmlPath = path.join(androidDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const capConfigRoot = path.join(rootDir, 'capacitor.config.json');
const capConfigAssets = path.join(androidDir, 'app', 'src', 'main', 'assets', 'capacitor.config.json');

function setConfig({ appId, appName, url }) {
  console.log(`\n========================================`);
  console.log(`🔧 Configurando: ${appName} (${appId})`);
  console.log(`🌐 URL de Inicialização: ${url}`);
  console.log(`========================================`);

  // 1. Atualiza build.gradle
  let bg = fs.readFileSync(buildGradlePath, 'utf8');
  bg = bg.replace(/applicationId\s+["'][^"']+["']/, `applicationId "${appId}"`);
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

function buildApk(targetApkName) {
  console.log(`🚀 Compilando APK Release via Gradle: ${targetApkName}...`);
  execSync('.\\gradlew.bat assembleRelease', {
    cwd: androidDir,
    stdio: 'inherit',
    env: process.env
  });

  const apkSource = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  const apkDest = path.join(outputDir, targetApkName);

  if (!fs.existsSync(apkSource)) {
    throw new Error(`APK gerado não encontrado em: ${apkSource}`);
  }

  fs.copyFileSync(apkSource, apkDest);
  const sizeMb = (fs.statSync(apkDest).size / (1024 * 1024)).toFixed(2);
  console.log(`✅ APK criado com sucesso: ${apkDest} (${sizeMb} MB)`);

  const publicApksDir = path.join(rootDir, 'public', 'apks');
  if (!fs.existsSync(publicApksDir)) fs.mkdirSync(publicApksDir, { recursive: true });
  fs.copyFileSync(apkSource, path.join(publicApksDir, targetApkName));
  console.log(`   └─ Copiado também para: ${path.join(publicApksDir, targetApkName)}`);
}

async function main() {
  try {
    // 1. Sincroniza web assets atualizados para o Android
    console.log("📦 Copiando web assets atualizados para android/app/src/main/assets/public/...");
    const publicAssetsDir = path.join(androidDir, 'app', 'src', 'main', 'assets', 'public');
    ['app.js', 'index.html', 'sw.js', 'supabase-client.js', 'default-data.js', 'styles.css'].forEach(file => {
      const src = path.join(rootDir, 'public', file);
      const dst = path.join(publicAssetsDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
      }
    });

    // 2. Build APK 1: Cliente
    setConfig({
      appId: "com.arenalimoeiro.cliente",
      appName: "Arena Limoeiro",
      url: "https://arenalimoeiro.vercel.app?app=apk_cliente"
    });
    buildApk("ArenaLimoeiro-Cliente.apk");

    // 3. Build APK 2: Controle
    setConfig({
      appId: "com.arenalimoeiro.controle",
      appName: "Arena Controle",
      url: "https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth?app=apk_controle"
    });
    buildApk("ArenaLimoeiro-Controle.apk");

    console.log("\n🎉 CONCLUÍDO COM SUCESSO!");
    console.log("Os 2 APKs estão prontos na pasta 'release-apks':");
    console.log("  1. ArenaLimoeiro-Cliente.apk  -> https://arenalimoeiro.vercel.app/");
    console.log("  2. ArenaLimoeiro-Controle.apk -> https://arenalimoeiro.vercel.app/adm-sec-x9k7-limoeiro-2026-auth");

  } catch (err) {
    console.error("❌ Erro durante a geração dos APKs:", err);
    process.exit(1);
  }
}

main();
