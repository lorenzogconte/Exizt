// src/app/(tabs)/index.tsx
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import React from 'react';
import { useUsageStats } from '../../hooks/useUsageStats';
import { useAppNameUtils } from '../../hooks/useAppNameUtils';

export default function Index() {
  const {
    usageStats,
    hasPermission,
    isLoading,
    selectedPeriod,
    setSelectedPeriod,
    calculateTotalScreenTime,
    openSettings
  } = useUsageStats();
  
  const { getAppName, formatUsageTime } = useAppNameUtils();

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

  // The rest of your component remains largely the same, but uses the hook values
  return (
    <View className="flex-1 bg-black px-4 py-6">
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-green text-3xl font-bold">Screen Time</Text>
          <Text className="text-white text-lg">Track your digital wellbeing</Text>
        </View>
      </View>
      
      <TimePeriodSelector />
      
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lightgrey text-lg">Loading usage data...</Text>
        </View>
      ) : !hasPermission ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lightgrey text-lg text-center mb-6">
            Permission is required to track screen time
          </Text>
          <TouchableOpacity 
            className="bg-lightgreen px-6 py-3 rounded-full"
            onPress={openSettings}
          >
            <Text className="text-lightgrey font-bold">Open Settings</Text>
          </TouchableOpacity>
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
                    <View className="h-10 w-10 rounded-md bg-lightgrey mr-3 items-center justify-center">
                      <Text className="text-black font-bold text-lg">
                        {getAppName(app.packageName).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-lightgrey font-bold">
                        {getAppName(app.packageName)}
                      </Text>
                      <Text className="text-lightgrey text-xs">
                        {app.packageName}
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