const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure axios adapter resolves to the http adapter (not xhr/browser)
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: false,
};

module.exports = config;
