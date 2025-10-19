import { useState, useEffect } from 'react';
import { Alert, Platform, NativeModules } from 'react-native';
import { showUsageAccessSettings, checkForPermission } from '@brighthustle/react-native-usage-stats-manager';
const { ScreenTimeStats } = NativeModules;

// ScreenTimeStats interface functions
export async function getTodaysScreenTime(year: number, month: number, day: number) {
  if (Platform.OS !== 'android') return { totalScreenTimeMs: 0, appUsage: {} };
  return await ScreenTimeStats.getDailyScreenTime(year, month, day);
}

export async function getWeeklyScreenTime(year: number, month: number, day: number) {
  if (Platform.OS !== 'android') return { totalScreenTimeMs: 0, appUsage: {} };
  return await ScreenTimeStats.getWeeklyScreenTime(year, month, day);
}

export async function formatTimeSpent(timeInMillis: number) {
  if (Platform.OS !== 'android') return '0s';
  return await ScreenTimeStats.formatTimeSpent(timeInMillis);
}

export interface AppUsageData {
  packageName: string;
  totalTimeInForeground: number;
  lastTimeUsed: number;
  appName?: string;
  appLabel?: string;
  iconBase64?: string;
}

export type TimePeriod = 'day' | 'week' | 'month';

export function useUsageStats(initialPeriod: TimePeriod = 'day') {
  // State variables
  const [usageStats, setUsageStats] = useState<AppUsageData[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(initialPeriod);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
      const now = new Date();
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Monday=0, Sunday=6
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek);
      monday.setHours(0,0,0,0);
      return monday;
  });
  const [debugMode, setDebugMode] = useState(false);
  const [ScreenTime, setScreenTime] = useState<number>(0);
  const [formattedScreenTime, setFormattedScreenTime] = useState<string>('');
  const [isRefreshingScreenTime, setIsRefreshingScreenTime] = useState(false);

  // Permission handling
  const checkPermission = async () => {
    if (Platform.OS !== 'android') return false;
    const hasPermission = await checkForPermission();
    setHasPermission(hasPermission);
    return hasPermission;
  };

  const openSettings = () => {
    showUsageAccessSettings('');
  };

  // Main function to fetch screen time for any period
  const fetchScreenTime = async (forceDebug = false) => {
    try {
      setIsLoading(true);
      setIsRefreshingScreenTime(true);

      const isDebug = debugMode || forceDebug;

      // Check permission first
      const hasPermission = await checkPermission();
      if (!hasPermission) {
        return false;
      }

      if (isDebug) {
        console.log(`Fetching stats for period: ${selectedPeriod}`);
      }

      let statsResult;
      switch (selectedPeriod) {
        case 'day': {
          // Use selectedDay for daily stats
          const year = selectedDay.getFullYear();
          const month = selectedDay.getMonth() + 1;
          const day = selectedDay.getDate();
          statsResult = await getTodaysScreenTime(year, month, day);
          break;
        }
        case 'week': {
          // Always use selectedWeekStart, calculate end date internally
          const monday = new Date(selectedWeekStart);
          monday.setHours(0,0,0,0);
          const today = new Date();
          today.setHours(0,0,0,0);
          // Find this week's Monday
          const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
          const thisMonday = new Date(today);
          thisMonday.setDate(today.getDate() - dayOfWeek);
          thisMonday.setHours(0,0,0,0);
          let endDate;
          if (monday.getTime() === thisMonday.getTime()) {
            endDate = today;
          } else {
            endDate = new Date(monday);
            endDate.setDate(monday.getDate() + 6);
          }
          const year = endDate.getFullYear();
          const month = endDate.getMonth() + 1;
          const day = endDate.getDate();
          console.log("Fetching weekly stats from", monday, "to", endDate);
          statsResult = await getWeeklyScreenTime(year, month, day);
          console.log("Weekly stats fetched for week");
          break;
        }
        default: {
          const year = selectedDay.getFullYear();
          const month = selectedDay.getMonth() + 1;
          const day = selectedDay.getDate();
          statsResult = await getTodaysScreenTime(year, month, day);
        }
      }

      const { totalScreenTimeMs, appUsage } = statsResult;

      // Update state with screen time data
      setScreenTime(totalScreenTimeMs);

      // Format the time
      const formatted = await formatTimeSpent(totalScreenTimeMs);
      setFormattedScreenTime(formatted);

      console.log(`============== ${selectedPeriod.toUpperCase()} SCREEN TIME =============`);
      console.log(`Total screen time: ${totalScreenTimeMs}ms (${Math.round(totalScreenTimeMs/1000/60)} minutes)`);
      console.log(`Formatted time: ${formatted}`);

      // Convert the appUsage to our AppUsageData format
      const stats = Object.keys(appUsage).map(packageName => {
        const app = appUsage[packageName];
        return {
          packageName,
          totalTimeInForeground: app.totalTimeInForeground,
          lastTimeUsed: app.lastTimeUsed,
          appName: packageName.split('.').pop() || packageName,
          appLabel: app.appLabel || '',
          iconBase64: app.iconBase64 || ''
        };
      });

      // Apply filtering: only apps with more than 1 minute usage
      const filteredStats = stats
        .filter(app => {
          const shouldInclude = app.totalTimeInForeground > 60000 && 
            !app.packageName.startsWith('com.android.systemui') &&
            !app.packageName.toLowerCase().includes('launcher');

          // Always include Exizt app
          if (app.packageName.includes('exizt') || app.packageName.includes('lorenzoconte')) {
            return true;
          }

          return shouldInclude;
        })
        .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground);

      setUsageStats(filteredStats);

      console.log('===== SCREEN TIME FETCH COMPLETE =====');
      return true;
    } catch (error) {
      console.error('Error fetching screen time:', error);
      return false;
    } finally {
      setIsLoading(false);
      setIsRefreshingScreenTime(false);
    }
  };

  // Calculate total screen time
  const calculateTotalScreenTime = () => {
    return usageStats.reduce((total, app) => total + app.totalTimeInForeground, 0);
  };

  // Initial data loading
  useEffect(() => {
    const checkPermissionAndFetchData = async () => {
      try {
          await fetchScreenTime();
      } catch (error) {
        console.error("Error in permission check or data fetch:", error);
        setIsLoading(false);
      }
    };
    
    checkPermissionAndFetchData();
  }, [selectedPeriod]);

  // Return hook values
  return {
    usageStats,
    hasPermission,
    isLoading,
    selectedPeriod,
    setIsLoading,
    setSelectedPeriod,
    selectedDay,
    setSelectedDay,
    selectedWeekStart,
    setSelectedWeekStart,
    calculateTotalScreenTime,
    openSettings,
    setDebugMode,
    ScreenTime,
    formattedScreenTime,
    isRefreshingScreenTime,
    fetchScreenTime
  };
}