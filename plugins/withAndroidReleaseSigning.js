const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Injeta a assinatura de release lendo credenciais de variáveis de ambiente
 * (RELEASE_STORE_FILE, RELEASE_STORE_PASSWORD, RELEASE_KEY_ALIAS, RELEASE_KEY_PASSWORD).
 * Necessário porque `expo prebuild --clean` recria android/app/build.gradle a cada build,
 * então a config de assinatura não pode viver só no arquivo commitado.
 */
function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    const contents = config.modResults.contents;

    if (contents.includes('RELEASE_STORE_FILE')) {
      return config;
    }

    const releaseSigningConfig = `    release {
        storeFile System.getenv("RELEASE_STORE_FILE") ? file(System.getenv("RELEASE_STORE_FILE")) : null
        storePassword System.getenv("RELEASE_STORE_PASSWORD")
        keyAlias System.getenv("RELEASE_KEY_ALIAS")
        keyPassword System.getenv("RELEASE_KEY_PASSWORD")
    }
`;

    let updated = contents.replace(
      /signingConfigs\s*\{/,
      (match) => `${match}\n${releaseSigningConfig}`
    );

    updated = updated.replace(
      /(release\s*\{[^}]*?signingConfig\s+)signingConfigs\.debug/,
      '$1signingConfigs.release'
    );

    config.modResults.contents = updated;
    return config;
  });
}

module.exports = withAndroidReleaseSigning;
