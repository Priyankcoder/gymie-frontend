const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add WASM support for expo-sqlite and ONNX Runtime Web
config.resolver.assetExts.push('wasm', 'onnx');

// Platform-specific file resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ensure platform-specific extensions are resolved in the correct order
// Platform-specific extensions (e.g., .web.ts) should be checked before generic ones
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs'];
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Configure transformer to handle ONNX Runtime Web
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Add resolver configuration for web
config.resolver.resolverMainFields = ['browser', 'module', 'main'];

module.exports = config;
