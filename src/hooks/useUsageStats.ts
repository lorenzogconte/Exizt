import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { 
  EventFrequency, 
  queryUsageStats, 
  showUsageAccessSettings, 
  checkForPermission 
} from '@brighthustle/react-native-usage-stats-manager';

export interface AppUsageData {
  packageName: string;
  totalTimeInForeground: number;
  lastTimeUsed: number;
  appName?: string;
}

export type TimePeriod = 'day' | 'week' | 'month';

export function useUsageStats(initialPeriod: TimePeriod = 'day') {
  const [usageStats, setUsageStats] = useState<AppUsageData[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(initialPeriod);

  // Request permissions for usage stats
  const requestUsageStatsPermission = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'Usage stats are only available on Android devices');
      setIsLoading(false);
      return false;
    }
  
    try {
      const hasPermission = await checkForPermission();
      setHasPermission(hasPermission);
      
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'To track screen time, you need to grant usage access permission.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsLoading(false)
            },
            {
              text: 'Open Settings',
              onPress: () => openSettings(),
            }
          ]
        );
      }
      return hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      setIsLoading(false);
      return false;
    }
  };

  const openSettings = () => {
    showUsageAccessSettings('');
  };

  // Fetch usage statistics based on selected time period
  const fetchUsageStats = async () => {
    try {
      setIsLoading(true);
      
      const endTime = Date.now();
      let startTime: number;
      
      switch (selectedPeriod) {
        case 'week':
          startTime = endTime - 7 * 24 * 60 * 60 * 1000; // 7 days ago
          break;
        case 'month':
          startTime = endTime - 30 * 24 * 60 * 60 * 1000; // 30 days ago
          break;
        case 'day':
        default:
          startTime = endTime - 24 * 60 * 60 * 1000; // 24 hours ago
          break;
      }
      
      const statsObject = await queryUsageStats(EventFrequency.INTERVAL_DAILY, startTime, endTime);
      
      const stats = Object.values(statsObject) as Array<AppUsageData>;
      // Filter out system apps and sort by usage time
      const filteredStats = stats.filter((app) => 
          app.totalTimeInForeground > 0 && 
          !app.packageName.startsWith('com.android.systemui') &&
          !app.packageName.startsWith('com.google.android.apps.nexuslauncher')
        )
        .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground);
      
      setUsageStats(filteredStats);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      Alert.alert('Error', 'Failed to fetch usage statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total screen time
  const calculateTotalScreenTime = () => {
    return usageStats.reduce((total, app) => total + app.totalTimeInForeground, 0);
  };

  // Effect to check permission and fetch data
  useEffect(() => {
    const checkPermissionAndFetchData = async () => {
      try {
        const granted = await requestUsageStatsPermission();
        if (granted) {
          await fetchUsageStats();
        }
      } catch (error) {
        console.error("Error in permission check or data fetch:", error);
        setIsLoading(false);
      }
    };
    
    checkPermissionAndFetchData();
  }, [selectedPeriod]);

  return {
    usageStats,
    hasPermission,
    isLoading,
    selectedPeriod,
    setSelectedPeriod,
    calculateTotalScreenTime,
    openSettings
  };
}