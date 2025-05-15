export function useAppNameUtils() {
  const getAppName = (packageName: string) => {
    const appNameMap: Record<string, string> = {
      'com.android.chrome': 'Chrome',
      'com.whatsapp': 'WhatsApp',
      'com.instagram.android': 'Instagram',
      'com.facebook.katana': 'Facebook',
      'com.google.android.youtube': 'YouTube',
      'com.twitter.android': 'Twitter',
      'com.spotify.music': 'Spotify',
      'com.netflix.mediaclient': 'Netflix',
    };
    
    return appNameMap[packageName] || packageName.split('.').pop() || packageName;
  };

  // Format time in milliseconds to readable format
  const formatUsageTime = (timeInMs: number) => {
    const hours = Math.floor(timeInMs / (1000 * 60 * 60));
    const minutes = Math.floor((timeInMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return {
    getAppName,
    formatUsageTime
  };
}