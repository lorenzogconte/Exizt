import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Switch, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import colors from '../../assets/colors.js';
import { useAppBlock } from '../hooks/useAppBlock';
import { useUsageStats } from '../hooks/useUsageStats';
import { useAppNameUtils } from '../hooks/useAppNameUtils';

export default function AppBlockSettings() {
  const { 
    hasPermission, 
    blockedApps, 
    toggleBlockedApp, 
    openAccessibilitySettings,
    installedApps,
    isLoadingApps,
    fetchInstalledApps
  } = useAppBlock();

  useEffect(() => {
    // Fetch installed apps when component mounts
    fetchInstalledApps();
  }, []);
  console.log('Installed Apps:', installedApps);

  const renderAppItem = ({ item }: { item: any }) => {
    const isBlocked = blockedApps.includes(item.packageName);
    
    return (
      <View className="bg-gray-800 mb-3 rounded-lg p-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center flex-1">
            <View className="h-10 w-10 rounded-md bg-lightgrey mr-3 items-center justify-center">
              {item.iconBase64 ? (
                <Image 
                  source={{ uri: `data:image/jpeg;base64,${item.iconBase64}` }}
                  style={{ width: 40, height: 40, borderRadius: 8 }}
                />
              ) : (
                <Text className="text-black font-bold text-lg">
                  {item.appName?.charAt(0).toUpperCase() || item.packageName.split('.').pop()?.charAt(0).toUpperCase() || 'A'}
                </Text>
              )}
            </View>
            <View className="flex-1 mr-4">
              <Text className="text-white font-bold" numberOfLines={1}>
                {item.appName || item.packageName.split('.').pop() || item.packageName}
              </Text>
              <Text className="text-lightgrey text-xs" numberOfLines={1}>
                {item.packageName}
              </Text>
            </View>
          </View>
          
          <Switch
            value={isBlocked}
            onValueChange={() => toggleBlockedApp(item.packageName)}
            trackColor={{ false: colors.gray, true: colors.verylightgreen }}
            thumbColor={isBlocked ? colors.lightgreen : colors.lightgrey}
          />
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black px-4 pt-12">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color={colors.verylightgreen} />
        </TouchableOpacity>
        <Text className="text-verylightgreen text-2xl font-bold">Apps to Block</Text>
      </View>
      
      {!hasPermission ? (
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="lock-closed" size={64} color={colors.lightgrey} />
          <Text className="text-white text-center text-lg font-bold mt-4 mb-2">
            Permission Required
          </Text>
          <Text className="text-lightgrey text-center mb-6">
            Exizt needs accessibility permission to block apps when you exceed your screen time goal.
          </Text>
          <TouchableOpacity 
            className="bg-verylightgreen px-6 py-3 rounded-md"
            onPress={openAccessibilitySettings}
          >
            <Text className="text-black font-bold">Grant Permission</Text>
          </TouchableOpacity>
        </View>
      ) : isLoadingApps ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.verylightgreen} />
          <Text className="text-lightgrey mt-4">Loading apps...</Text>
        </View>
      ) : (
        <>
          <Text className="text-lightgrey mb-6">
            Select the apps you want to block when you exceed your daily screen time goal or when focus mode is active.
          </Text>
          
          <FlatList
            data={installedApps}
            renderItem={renderAppItem}
            keyExtractor={(item) => item.packageName}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center p-4">
                <Text className="text-lightgrey text-center">
                  No apps found. Please use your device for a while to track app usage.
                </Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}