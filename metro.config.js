const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add WASM support for expo-sqlite and ONNX Runtime Web
config.resolver.assetExts.push('wasm', 'onnx');

// Platform-specific file resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ensure platform-specific extensions are resolved in the correct order
// Platform-specific  extensions MUST be checked before generic ones
// This ensures .web.tsx takes precedence over .tsx when building for web
// and .native.tsx takes precedence for native platforms
config.resolver.sourceExts = [
  // Platform-specific extensions first (highest priority)
  'web.tsx',
  'web.ts',
  'web.jsx',
  'web.js',
  'native.tsx',
  'native.ts',
  'native.jsx',
  'native.js',
  'ios.tsx',
  'ios.ts',
  'ios.jsx',
  'ios.js',
  'android.tsx',
  'android.ts',
  'android.jsx',
  'android.js',
  // Generic extensions (lower priority)
  'tsx',
  'ts',
  'jsx',
  'js',
  'json',
  'cjs',
  'mjs',
];

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
