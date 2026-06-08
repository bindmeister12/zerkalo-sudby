const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

/**
 * Исключаем из watch временные директории expo-dev-launcher (`*_tmp_*`).
 * Они создаются и удаляются на лету при первом запуске Dev Client, и Metro
 * падает с ENOENT при попытке их watch'ить (особенно в pnpm + Replit).
 */
config.resolver = config.resolver || {};
const extraBlock = /node_modules[\\/].*expo-dev-launcher[^\\/]*[\\/]?node_modules[\\/]expo-dev-launcher_tmp_[^\\/]*[\\/].*/;
config.resolver.blockList = config.resolver.blockList
  ? Array.isArray(config.resolver.blockList)
    ? [...config.resolver.blockList, extraBlock]
    : [config.resolver.blockList, extraBlock]
  : extraBlock;

config.watcher = config.watcher || {};
config.watcher.watchman = config.watcher.watchman || {};
config.watcher.healthCheck = config.watcher.healthCheck || {};

// На всякий случай — игнорируем эти же пути на уровне file-map (как и blockList).
const ignored = [/expo-dev-launcher_tmp_/];
if (Array.isArray(config.resolver.assetExts)) {
  // no-op: оставляем дефолтные расширения
}
config.resolver.unstable_enableSymlinks = config.resolver.unstable_enableSymlinks ?? true;
config.resolver.unstable_enablePackageExports = config.resolver.unstable_enablePackageExports ?? true;

// Объединяем watchFolders, чтобы Metro не пытался watch'ить tmp-пути.
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
config.watchFolders = (config.watchFolders || []).concat([workspaceRoot]).filter((p, i, a) => a.indexOf(p) === i);
// Передаём ignored через server.enhanceMiddleware нельзя — оставляем blockList выше.
void ignored;

module.exports = config;
