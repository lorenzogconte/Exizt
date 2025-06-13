import { useState, useEffect } from 'react';
import { NativeModules, NativeEventEmitter, Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUsageStats } from './useUsageStats';

const { AppBlockModule } = NativeModules;

interface AppBlockState {
  hasPermission: boolean;
  blockedApps: string[];
  isBlockingActive: boolean;
  isFocusModeActive: boolean;
  remainingTime: number | null;
}

export function useAppBlock() {
  const [state, setState] = useState<AppBlockState>({
    hasPermission: false,
    blockedApps: [],
    isBlockingActive: false,
    isFocusModeActive: false,
    remainingTime: null,
  });
  const [installedApps, setInstalledApps] = useState<any[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  
  const { calculateTotalScreenTime } = useUsageStats();
  
  // Check if we have accessibility permission
  const checkPermission = async () => {
    if (Platform.OS !== 'android') return false;
    
    try {
      const hasPermission = await AppBlockModule.checkAccessibilityPermission();
      setState(prev => ({ ...prev, hasPermission }));
      return hasPermission;
    } catch (error) {
      console.error('Error checking accessibility permission:', error);
      return false;
    }
  };
  
  // Open accessibility settings
  const openAccessibilitySettings = () => {
    if (Platform.OS !== 'android') return;
    AppBlockModule.openAccessibilitySettings();
  };
  
  // Load blocked apps from storage
  const loadBlockedApps = async () => {
    if (Platform.OS !== 'android') return;
    
    try {
      const blockedAppsString = await AppBlockModule.getBlockedApps();
      const blockedApps = blockedAppsString ? blockedAppsString.split(',') : [];
      setState(prev => ({ ...prev, blockedApps }));
    } catch (error) {
      console.error('Error loading blocked apps:', error);
    }
  };
  
  // Save blocked apps to storage
  const saveBlockedApps = async (apps: string[]) => {
    if (Platform.OS !== 'android') return;
    
    try {
      await AppBlockModule.setBlockedApps(apps);
      setState(prev => ({ ...prev, blockedApps: apps }));
    } catch (error) {
      console.error('Error saving blocked apps:', error);
    }
  };
  
  // Toggle an app in the blocked list
  const toggleBlockedApp = async (packageName: string) => {
    const newBlockedApps = [...state.blockedApps];
    const index = newBlockedApps.indexOf(packageName);
    
    if (index === -1) {
      newBlockedApps.push(packageName);
    } else {
      newBlockedApps.splice(index, 1);
    }
    
    await saveBlockedApps(newBlockedApps);
  };
  
  // Set focus mode active/inactive
  const setFocusMode = async (active: boolean) => {
    if (Platform.OS !== 'android') return;
    
    try {
      await AppBlockModule.setFocusModeActive(active);
      setState(prev => ({ ...prev, isFocusModeActive: active }));
    } catch (error) {
      console.error('Error setting focus mode:', error);
    }
  };
  
  const fetchInstalledApps = async () => {
    if (Platform.OS !== 'android') return [];
    
    setIsLoadingApps(true);
    try {
      const apps = await AppBlockModule.getInstalledApplications();
      console.log(`Found ${apps.length} installed applications`);
      
      const filteredApps = apps.filter((app: any) => {
        // Check if app name is the same as package name
        const isTechnicalName = app.appName === app.packageName;

        return !isTechnicalName;
      });
    
      console.log(`After filtering: ${filteredApps.length} user-friendly apps remain`);
      
      // Log some filtered apps for debugging
      filteredApps.slice(0, 10).forEach((app: any, index: number) => {
        console.log(`${index + 1}. ${app.appName} (${app.packageName})`);
      });

      setInstalledApps(filteredApps);

      return apps;
    } catch (error) {
      console.error('Error fetching installed apps:', error);
      return [];
    } finally {
      setIsLoadingApps(false);
    }
  };
  // Check if screen time limit is exceeded and update blocking state
  const checkScreenTimeLimit = async () => {
    if (Platform.OS !== 'android') return;
    
    try {
      const screenTimeGoal = await AsyncStorage.getItem('dailyScreenTimeGoal');
      const goalInMinutes = screenTimeGoal ? parseInt(screenTimeGoal) * 60 : 120; // Default 2 hours
      
      const totalScreenTimeToday = calculateTotalScreenTime();
      const timeInMinutes = Math.floor(totalScreenTimeToday / (60 * 1000));
      
      const shouldBlock = timeInMinutes >= goalInMinutes;
      const remainingTime = shouldBlock ? 0 : goalInMinutes - timeInMinutes;
      
      await AppBlockModule.setBlockingActive(shouldBlock);
      setState(prev => ({ 
        ...prev, 
        isBlockingActive: shouldBlock,
        remainingTime: remainingTime
      }));
    } catch (error) {
      console.error('Error checking screen time limit:', error);
    }
  };
  
  // Initialize everything
  useEffect(() => {
    // Set up app state change listener to update when app comes to foreground
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkPermission();
        loadBlockedApps();
        checkScreenTimeLimit();
      }
    });
    
    // Set up listener for blocked app events
    let blockedAppListener: any;
    if (Platform.OS === 'android') {
      const eventEmitter = new NativeEventEmitter(AppBlockModule);
      blockedAppListener = eventEmitter.addListener('onAppBlocked', (event) => {
        // You can do something when an app is blocked
        console.log('App blocked:', event.packageName);
      });
    }
    
    checkPermission();
    loadBlockedApps();
    checkScreenTimeLimit();
    
    // Update blocking state every minute
    const intervalId = setInterval(checkScreenTimeLimit, 60000);
    
    return () => {
      appStateSubscription.remove();
      if (blockedAppListener) blockedAppListener.remove();
      clearInterval(intervalId);
    };
  }, []);
  
  return {
    ...state,
    checkPermission,
    openAccessibilitySettings,
    toggleBlockedApp,
    setFocusMode,
    checkScreenTimeLimit,
    installedApps,
    isLoadingApps,
    fetchInstalledApps,
  };
}