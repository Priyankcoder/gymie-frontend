const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add WASM support for expo-sqlite (native platforms only)
config.resolver.assetExts.push('wasm');

// Ensure platform-specific extensions are resolved in the correct order
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs'];

// Platform-specific file resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
