const { withDangerousMod, withPlugins } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to register NutritionClassifier native module
 * 
 * This plugin modifies the native Android and iOS code to include
 * our custom TensorFlow Lite classifier module.
 */

/**
 * Add the NutritionClassifierPackage to MainApplication.kt
 */
function withAndroidNutritionClassifier(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const mainApplicationPath = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/java/com/anonymous/Gymie/MainApplication.kt'
      );

      if (fs.existsSync(mainApplicationPath)) {
        let content = fs.readFileSync(mainApplicationPath, 'utf-8');

        // Add import if not present
        if (!content.includes('import com.gymie.NutritionClassifierPackage')) {
          content = content.replace(
            /(package com\.anonymous\.Gymie)/,
            '$1\n\nimport com.gymie.NutritionClassifierPackage'
          );
        }

        // Add package to getPackages() if not present
        if (!content.includes('NutritionClassifierPackage()')) {
          content = content.replace(
            /(override fun getPackages\(\): List<ReactPackage> \{[\s\S]*?return listOf\()/,
            '$1\n        NutritionClassifierPackage(),'
          );
        }

        fs.writeFileSync(mainApplicationPath, content);
        console.log('✅ Added NutritionClassifierPackage to MainApplication.kt');
      }

      return config;
    },
  ]);
}

/**
 * Add Swift bridging header and TensorFlow Lite pod to iOS project
 */
function withIOSNutritionClassifier(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectName = config.modRequest.projectName || 'Gymie';
      const bridgingHeaderPath = path.join(
        config.modRequest.platformProjectRoot,
        `${projectName}-Bridging-Header.h`
      );

      // Create bridging header if it doesn't exist
      if (!fs.existsSync(bridgingHeaderPath)) {
        const bridgingHeader = `//
//  Use this file to import your target's public headers that you would like to expose to Swift.
//

#import <React/RCTBridgeModule.h>
`;
        fs.writeFileSync(bridgingHeaderPath, bridgingHeader);
        console.log('✅ Created iOS bridging header');
      }

      // Update project.pbxproj to reference the bridging header
      const pbxprojPath = path.join(
        config.modRequest.platformProjectRoot,
        `${projectName}.xcodeproj/project.pbxproj`
      );

      if (fs.existsSync(pbxprojPath)) {
        let content = fs.readFileSync(pbxprojPath, 'utf-8');
        
        if (!content.includes('SWIFT_OBJC_BRIDGING_HEADER')) {
          // Add bridging header setting to build configurations
          content = content.replace(
            /(SWIFT_VERSION = \d+\.\d+;)/g,
            `$1\n\t\t\t\tSWIFT_OBJC_BRIDGING_HEADER = "${projectName}/${projectName}-Bridging-Header.h";`
          );
          
          fs.writeFileSync(pbxprojPath, content);
          console.log('✅ Added bridging header to Xcode project');
        }
      }

      // Add TensorFlow Lite pod to Podfile
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );

      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf-8');
        
        // Check if TensorFlowLiteSwift is already added
        if (!podfileContent.includes('TensorFlowLiteSwift')) {
          // Add TensorFlow Lite pod before the 'use_expo_modules!' line
          podfileContent = podfileContent.replace(
            /(use_expo_modules!)/,
            `# TensorFlow Lite for ML inference\n  pod 'TensorFlowLiteSwift', '~> 2.14.0'\n\n  $1`
          );
          
          fs.writeFileSync(podfilePath, podfileContent);
          console.log('✅ Added TensorFlowLiteSwift pod to Podfile');
          console.log('⚠️  Run "cd ios && pod install" to install the pod');
        }
      }

      return config;
    },
  ]);
}

module.exports = function withNutritionClassifier(config) {
  return withPlugins(config, [
    withAndroidNutritionClassifier,
    withIOSNutritionClassifier,
  ]);
};
