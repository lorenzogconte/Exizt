const { withAndroidManifest } = require('@expo/config-plugins');

const withUsageStats = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Ensure permissions array exists
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    // Add usage stats permission if it doesn't exist
    const usageStatsPermission = androidManifest.manifest['uses-permission'].find(
      (permission) => 
        permission.$['android:name'] === 'android.permission.PACKAGE_USAGE_STATS'
    );

    if (!usageStatsPermission) {
      androidManifest.manifest['uses-permission'].push({
        $: {
          'android:name': 'android.permission.PACKAGE_USAGE_STATS',
          'tools:ignore': 'ProtectedPermissions',
        },
      });

      // Add tools namespace if not present
      const manifestNode = androidManifest.manifest.$;
      if (!manifestNode['xmlns:tools']) {
        manifestNode['xmlns:tools'] = 'http://schemas.android.com/tools';
      }
    }

    return config;
  });
};

module.exports = withUsageStats;