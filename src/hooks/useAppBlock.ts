import { useState, useEffect } from 'react';
import { NativeModules, NativeEventEmitter, Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUsageStats } from './useUsageStats';
import { set } from 'date-fns';
import { showUsageAccessSettings, checkForPermission } from '@brighthustle/react-native-usage-stats-manager';

const { AppBlockModule } = NativeModules;

interface AppBlockState {
  hasNormalPermission: boolean;
  hasBlockPermission: boolean;
  hasBatteryPermission: boolean;
  hasAllPermission: boolean;
  blockedApps: string[];
  isBlockingActive: boolean;
  isFocusModeActive: boolean;
  remainingTime: number | null;
}

export function useAppBlock() {
  const [state, setState] = useState<AppBlockState>({
    hasNormalPermission: false,
    hasBlockPermission: false,
    hasBatteryPermission: false,
    blockedApps: [],
    isBlockingActive: false,
    isFocusModeActive: false,
    remainingTime: null,
  });
  const [installedApps, setInstalledApps] = useState<any[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  
  const { calculateTotalScreenTime } = useUsageStats();
  
  // Check if we have accessibility permission
  const checkPermission = async (mode: 'normal' | 'blocking' | 'battery' | 'all') => {
    if (Platform.OS !== 'android') return false;
    
    try {
      if (mode === 'all') {
        const normal = await AppBlockModule.checkAccessibilityPermission('normal');
        const blocking = await AppBlockModule.checkAccessibilityPermission('blocking');
        const battery = await AppBlockModule.checkAccessibilityPermission('battery');
        const time = await checkForPermission();
        hasAllPermission = normal && blocking && battery && time;
        setState(prev => ({ ...prev, hasNormalPermission: normal }));
        setState(prev => ({ ...prev, hasBlockPermission: blocking }));
        setState(prev => ({ ...prev, hasBatteryPermission: battery }));
        return hasAllPermission;
      }
      else if (mode === 'normal') {
        let hasNormalPermission = await AppBlockModule.checkAccessibilityPermission(mode);
        setState(prev => ({ ...prev, hasNormalPermission }));
        return hasNormalPermission;
      }
      else if (mode === 'blocking') {
        let hasBlockPermission = await AppBlockModule.checkAccessibilityPermission(mode);
        setState(prev => ({ ...prev, hasBlockPermission }));
        return hasBlockPermission;
      }
      else if (mode === 'battery') {
        let hasBatteryPermission = await AppBlockModule.checkAccessibilityPermission(mode);
        setState(prev => ({ ...prev, hasBatteryPermission }));
        return hasBatteryPermission;
      }
    } catch (error) {
      console.error('Error checking accessibility permission:', error);
      return false;
    }
  };
  
  // Open accessibility settings
  const openAccessibilitySettings = (mode: 'normal' | 'blocking' | 'battery' | 'time' ) => {
    if (Platform.OS !== 'android') return;
    if (mode === 'normal' && state.hasNormalPermission) return;
    if (mode === 'blocking' && state.hasBlockPermission) return;
    if (mode === 'normal') AppBlockModule.openAccessibilitySettings('normal');
    if (mode === 'blocking') AppBlockModule.openAccessibilitySettings('blocking');
    if (mode === 'battery') AppBlockModule.openAccessibilitySettings('battery');
    if (mode === 'time') showUsageAccessSettings(''); 
  }

  
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
  
  const getFocusMode = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    try {
      const isFocusModeActive = await AppBlockModule.getFocusMode();
      return !!isFocusModeActive;
    } catch (error) {
      console.error('Error getting focus mode state:', error);
      return false;
    }
  };

  // Set focus mode active/inactive
  const setFocusMode = async (active: boolean) => {
    if (Platform.OS !== 'android') return;
    
    try {
      await AppBlockModule.setFocusMode(active);
      console.log('Focus mode set to:', active);
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
        checkPermission('normal');
        loadBlockedApps();
        checkScreenTimeLimit();
      }
    });
    
    
    checkPermission('normal');
    checkPermission('blocking');
    loadBlockedApps();
    checkScreenTimeLimit();
    
    // Update blocking state every minute
    const intervalId = setInterval(checkScreenTimeLimit, 60000);
    
    return () => {
      appStateSubscription.remove();
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
    getFocusMode,
  };
}