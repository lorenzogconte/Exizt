import { View, Text, TouchableOpacity, ScrollView, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useUsageStats } from '../../hooks/useUsageStats';
import { useAppNameUtils } from '../../hooks/useAppNameUtils';
import { useAppBlock } from '../../hooks/useAppBlock';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../assets/colors.js';
import { NativeModules } from 'react-native';

export default function Index() {
  const router = useRouter();

  const {
    usageStats,
    isLoading,
    selectedPeriod,
    setSelectedPeriod,
    calculateTotalScreenTime,
  } = useUsageStats();

  const { checkPermission } = useAppBlock();
  
  const { formatUsageTime } = useAppNameUtils();

  const {
    isFocusModeActive,
    remainingTime,
    getFocusMode,
    setFocusMode,
  } = useAppBlock();

  const [isScrollBlocked, setIsScrollBlocked] = useState(false);
  
  useEffect(() => {
    const checkAllPermissions = async () => {
      const hasAllPermissions = await checkPermission('all');
      if (!hasAllPermissions) {
        router.replace('/permissions');
      }
    };
    checkAllPermissions();
  }, []);

  useEffect(() => {
    getFocusMode();
  }, []);
  
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
        <Text className={`font-semibold ${selectedPeriod === 'day' ? 'text-black' : 'text-gray'}`}>
          Today
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        className={`px-4 py-2 rounded-full ${selectedPeriod === 'week' ? 'bg-lightgrey' : 'bg-transparent'}`}
        onPress={() => setSelectedPeriod('week')}
      >
        <Text className={`font-semibold ${selectedPeriod === 'week' ? 'text-black' : 'text-gray'}`}>
          Week
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        className={`px-4 py-2 rounded-full ${selectedPeriod === 'month' ? 'bg-lightgrey' : 'bg-transparent'}`}
        onPress={() => setSelectedPeriod('month')}
      >
        <Text className={`font-semibold ${selectedPeriod === 'month' ? 'text-black' : 'text-gray'}`}>
          Month
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-black px-4 py-6">
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-green text-3xl font-bold">Screen Time</Text>
          <Text className="text-white text-lg">Track your digital wellbeing</Text>
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
            <Text className={`font-bold ${isFocusModeActive ? 'text-black' : 'text-lightgrey'}`}>
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
            <Text className="text-lightgrey font-bold">Block Apps</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', marginRight: 8 }}>Block Scrolling</Text>
        <Switch
          value={isScrollBlocked}
          onValueChange={setIsScrollBlocked}
          thumbColor={isScrollBlocked ? '#B2FF59' : '#fff'}
          trackColor={{ false: '#444', true: '#B2FF59' }}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lightgrey text-lg">Loading usage data...</Text>
        </View>
      ) : usageStats.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lightgrey text-lg text-center">
            No usage data available for this period
          </Text>
        </View>
      ) : (
        <>
          {/* Rendering logic remains the same */}
          <View className="bg-gray rounded-lg p-4 mb-6">
            <Text className="text-white text-base mb-1">Total Screen Time</Text>
            <Text className="text-white text-2xl font-bold">
              {formatUsageTime(calculateTotalScreenTime())}
            </Text>
          </View>
          
          <Text className="text-white text-xl font-bold mb-4">Top Apps</Text>
          
          <ScrollView className="flex-1">
            {usageStats.slice(0, 10).map((app, index) => (
              <View key={app.packageName} className="bg-gray mb-3 rounded-lg p-4">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <View>
                      <Text className="text-lightgrey font-bold">
                        {app.appName}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-lightgrey font-semibold">
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