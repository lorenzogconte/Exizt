import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useUsageStats } from '../../hooks/useUsageStats';
import { useAppNameUtils } from '../../hooks/useAppNameUtils';
import { useAppBlock } from '../../hooks/useAppBlock';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../assets/colors.js';
import { Alert } from 'react-native';
import * as Font from 'expo-font';

export default function Index() {
  const router = useRouter();

  const {
    usageStats,
    hasPermission,
    isLoading,
    selectedPeriod,
    setIsLoading,
    setSelectedPeriod,
    calculateTotalScreenTime,
    openSettings,
    fetchScreenTime
  } = useUsageStats();
  
  const { formatUsageTime } = useAppNameUtils();

  const {
    isFocusModeActive,
    remainingTime,
    getFocusMode,
    setFocusMode,
    checkPermission
  } = useAppBlock();

  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      'montserrat_black': require('../../../assets/fonts/montserrat_black.ttf'),
      'montserrat_blackitalic': require('../../../assets/fonts/montserrat_blackitalic.ttf'),
      'montserrat_bold': require('../../../assets/fonts/montserrat_bold.ttf'),
      'montserrat_bolditalic': require('../../../assets/fonts/montserrat_bolditalic.ttf'),
      'montserrat_extrabold': require('../../../assets/fonts/montserrat_extrabold.ttf'),
      'montserrat_extrabolditalic': require('../../../assets/fonts/montserrat_extrabolditalic.ttf'),
      'montserrat_extralight': require('../../../assets/fonts/montserrat_extralight.ttf'),
      'montserrat_extralightitalic': require('../../../assets/fonts/montserrat_extralightitalic.ttf'),
      'montserrat_italic': require('../../../assets/fonts/montserrat_italic.ttf'),
      'montserrat_light': require('../../../assets/fonts/montserrat_light.ttf'),
      'montserrat_lightitalic': require('../../../assets/fonts/montserrat_lightitalic.ttf'),
      'montserrat_medium': require('../../../assets/fonts/montserrat_medium.ttf'),
      'montserrat_mediumitalic': require('../../../assets/fonts/montserrat_mediumitalic.ttf'),
      'montserrat_regular': require('../../../assets/fonts/montserrat_regular.ttf'),
      'montserrat_semibold': require('../../../assets/fonts/montserrat_semibold.ttf'),
      'montserrat_semibolditalic': require('../../../assets/fonts/montserrat_semibolditalic.ttf'),
      'montserrat_thin': require('../../../assets/fonts/montserrat_thin.ttf'),
      'montserrat_thinitalic': require('../../../assets/fonts/montserrat_thinitalic.ttf'),
    }).then(() => setFontsLoaded(true));
  }, []);

  useEffect(() => {
    getFocusMode();
  }, []);

  useEffect(() => {
    const checkAllPermissions = async () => {
      const hasAllPermissions = await checkPermission('all');
      if (!hasAllPermissions) {
        router.replace('/permissions');
      }
    };
    checkAllPermissions();
  }, []);

  if (!fontsLoaded) {
    return null; // Or a loading spinner
  }
  
  
  const navigateToAppBlockSettings = () => {
    router.push('/appblockselection');
  };
  
  const toggleFocusMode = () => {
    setFocusMode(!isFocusModeActive);
  };
  // Time period selector component (kept inline since we're not extracting components)
  const TimePeriodSelector = () => (
    <View className="flex-row justify-center mb-6 bg-black rounded-full p-1">
      <TouchableOpacity
        className={`px-4 py-2 rounded-full ${selectedPeriod === 'day' ? 'bg-lightgrey' : 'bg-transparent'}`}
        onPress={() => setSelectedPeriod('day')}
      >
        <Text className={`${selectedPeriod === 'day' ? 'font-montserrat_bold text-black' : 'font-montserrat_medium text-gray'}`}>
          Today
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        className={`px-4 py-2 rounded-full ${selectedPeriod === 'week' ? 'bg-lightgrey' : 'bg-transparent'}`}
        onPress={() => setSelectedPeriod('week')}
      >
        <Text className={`${selectedPeriod === 'week' ? 'font-montserrat_bold text-black' : 'font-montserrat_medium text-gray'}`}>
          Week
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        className={`px-4 py-2 rounded-full ${selectedPeriod === 'month' ? 'bg-lightgrey' : 'bg-transparent'}`}
        onPress={() => setSelectedPeriod('month')}
      >
        <Text className={`${selectedPeriod === 'month' ? 'font-montserrat_bold text-black' : 'font-montserrat_medium text-gray'}`}>
          Month
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-black px-4 py-6">
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="font-montserrat_extrabold text-green text-3xl">Screen Time</Text>
          <Text className="font-montserrat_light text-white text-lg">Track your digital wellbeing</Text>
        </View>
      </View>

      <TimePeriodSelector />
      
      <View className="flex-row justify-between mb-6">
        <TouchableOpacity
          className={`flex-1 py-3 px-4 rounded-lg mr-2 ${isFocusModeActive ? 'bg-verylightgreen' : 'bg-gray-700'}`}
          onPress={toggleFocusMode}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons 
              name="moon" 
              size={18} 
              color={isFocusModeActive ? colors.black : colors.lightgrey} 
              style={{ marginRight: 8 }}
            />
            <Text className={`font-montserrat_bold ${isFocusModeActive ? 'text-black' : 'text-lightgrey'}`}>
              Focus Mode
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-1 bg-gray-700 py-3 px-4 rounded-lg ml-2"
          onPress={navigateToAppBlockSettings}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons 
              name="apps" 
              size={18} 
              color={colors.lightgrey} 
              style={{ marginRight: 8 }}
            />
            <Text className="text-lightgrey font-montserrat_bold">Block Apps</Text>
          </View>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lightgrey text-lg font-montserrat_regular">Loading usage data...</Text>
        </View>
      ) : usageStats.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lightgrey text-lg text-center font-montserrat_thin">
            No usage data available for this period
          </Text>
        </View>
      ) : (
        <>
          {/* Rendering logic remains the same */}
          <View className="bg-gray rounded-lg p-4 mb-6">
            <Text className="font-montserrat_semibold text-white text-base mb-1">Total Screen Time</Text>
            <Text className="font-montserrat_extrabold text-white text-2xl font-bold">
              {formatUsageTime(calculateTotalScreenTime())}
            </Text>
          </View>
          
          <Text className="text-white text-xl font-montserrat_black mb-4">Top Apps</Text>
          
          <ScrollView className="flex-1">
            {usageStats.slice(0, 10).map((app, index) => (
              <View key={app.packageName} className="bg-gray mb-3 rounded-lg p-4">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <View>
                      <Text className="text-lightgrey font-montserrat_light">
                        {app.appName}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-lightgrey font-montserrat_medium">
                    {formatUsageTime(app.totalTimeInForeground)}
                  </Text>
                </View>
                
                {/* Usage bar */}
                <View className="h-2 bg-black rounded-full mt-3">
                  <View 
                    className="h-2 bg-lightgreen rounded-full" 
                    style={{ 
                      width: `${(app.totalTimeInForeground / calculateTotalScreenTime()) * 100}%` 
                    }} 
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}