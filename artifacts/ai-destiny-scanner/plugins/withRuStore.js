/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Expo Config Plugin: RuStore Pay SDK 10.3.1
 *
 * Что делает (только Android):
 *  - Добавляет Maven-репозиторий VK Partner в android/build.gradle
 *  - Добавляет зависимость ru.rustore.sdk-wrapper.react-native:pay:10.3.1
 *  - Прописывает console_app_id_value и sdk_pay_scheme_value в AndroidManifest.xml
 *  - Добавляет intent-filter для deeplink (возврат из банковского приложения)
 *  - Добавляет PayActivity в AndroidManifest
 *  - Регистрирует RuStoreReactPayPackage в MainApplication (Java & Kotlin)
 */

const {
  withProjectBuildGradle,
  withAppBuildGradle,
  withAndroidManifest,
  withMainApplication,
} = require("@expo/config-plugins");

const MAVEN_REPO_BLOCK = `        maven {
            url = uri("https://artifactory-external.vkpartner.ru/artifactory/maven")
        }`;

const RUSTORE_DEPENDENCY = `    implementation("ru.rustore.sdk-wrapper.react-native:pay:10.3.1")`;

function withRuStoreMavenRepo(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.contents.includes("vkpartner.ru/artifactory/maven")) {
      return cfg;
    }
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /allprojects\s*\{[\s\S]*?repositories\s*\{/,
      (match) => `${match}\n${MAVEN_REPO_BLOCK}`
    );
    if (!cfg.modResults.contents.includes("vkpartner.ru/artifactory/maven")) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /repositories\s*\{/,
        (match) => `${match}\n${MAVEN_REPO_BLOCK}`
      );
    }
    return cfg;
  });
}

function withRuStoreDependency(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.contents.includes("rustore.sdk-wrapper.react-native:pay")) {
      return cfg;
    }
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /dependencies\s*\{/,
      `dependencies {\n${RUSTORE_DEPENDENCY}`
    );
    return cfg;
  });
}

function withRuStoreManifest(config, props) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;

    const scheme = props.deeplinkScheme || "mirodestiny";
    const consoleAppId = props.consoleAppId || "";

    app["meta-data"] = app["meta-data"] || [];

    const upsertMeta = (name, value) => {
      const existing = app["meta-data"].find((m) => m.$?.["android:name"] === name);
      if (existing) {
        existing.$["android:value"] = value;
      } else {
        app["meta-data"].push({ $: { "android:name": name, "android:value": value } });
      }
    };

    upsertMeta("console_app_id_value", consoleAppId);
    upsertMeta("sdk_pay_scheme_value", scheme);

    app.activity = app.activity || [];
    const payActivity = {
      $: {
        "android:name": "ru.rustore.sdk.pay.internal.presentation.ui.PayActivity",
        "android:exported": "false",
        "android:launchMode": "singleTask",
        "tools:replace": "android:launchMode",
      },
    };
    const alreadyHasPayActivity = app.activity.some(
      (a) => a.$?.["android:name"] === "ru.rustore.sdk.pay.internal.presentation.ui.PayActivity"
    );
    if (!alreadyHasPayActivity) {
      app.activity.push(payActivity);
    }

    const mainActivity = app.activity.find(
      (a) => a.$?.["android:name"] === ".MainActivity" || a.$?.["android:name"]?.endsWith("MainActivity")
    );
    if (mainActivity) {
      mainActivity.$["android:launchMode"] = "singleTop";
      mainActivity["intent-filter"] = mainActivity["intent-filter"] || [];
      const hasDeeplink = mainActivity["intent-filter"].some((f) =>
        f.data?.some((d) => d.$?.["android:scheme"] === scheme)
      );
      if (!hasDeeplink) {
        mainActivity["intent-filter"].push({
          action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
          category: [
            { $: { "android:name": "android.intent.category.DEFAULT" } },
            { $: { "android:name": "android.intent.category.BROWSABLE" } },
          ],
          data: [{ $: { "android:scheme": scheme } }],
        });
      }
    }

    if (!cfg.modResults.manifest.$) cfg.modResults.manifest.$ = {};
    cfg.modResults.manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";

    return cfg;
  });
}

function withRuStoreMainApplication(config) {
  return withMainApplication(config, (cfg) => {
    const src = cfg.modResults.contents;

    if (src.includes("RuStoreReactPayPackage")) return cfg;

    if (src.includes("class MainApplication : Application")) {
      cfg.modResults.contents = src
        .replace(
          "import expo.modules.ReactNativeHostWrapper",
          "import expo.modules.ReactNativeHostWrapper\nimport ru.rustore.react.pay.RuStoreReactPayPackage"
        )
        .replace(
          /PackageList\(this\)\.packages/,
          "PackageList(this).packages.apply { add(RuStoreReactPayPackage()) }"
        );
    } else {
      cfg.modResults.contents = src
        .replace(
          "import com.facebook.react.PackageList;",
          "import com.facebook.react.PackageList;\nimport ru.rustore.react.pay.RuStoreReactPayPackage;"
        )
        .replace(
          /new PackageList\(this\)\.getPackages\(\)/,
          "new PackageList(this).getPackages()"
        );

      if (src.includes("packages.add") || src.includes("List<ReactPackage>")) {
        cfg.modResults.contents = cfg.modResults.contents.replace(
          /return packages;/,
          "packages.add(new RuStoreReactPayPackage());\n      return packages;"
        );
      }
    }

    return cfg;
  });
}

const withRuStore = (config, props = {}) => {
  // Skip entire plugin when consoleAppId is not configured —
  // avoids downloading ru.rustore Maven artifacts from vkpartner.ru
  // on EAS Build servers where the repo may be unreachable.
  if (!props.consoleAppId) {
    return config;
  }
  let cfg = config;
  cfg = withRuStoreMavenRepo(cfg);
  cfg = withRuStoreDependency(cfg);
  cfg = withRuStoreManifest(cfg, props);
  cfg = withRuStoreMainApplication(cfg);
  return cfg;
};

module.exports = withRuStore;
