import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import PieChart from 'react-native-pie-chart';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useUsageStats } from '../../hooks/useUsageStats';
import { useAppNameUtils } from '../../hooks/useAppNameUtils';
import { useAppBlock } from '../../hooks/useAppBlock';
import * as Font from 'expo-font';

export default function Index() {
  const router = useRouter();

  const {
    usageStats,
    isLoading,
    selectedPeriod,
    setSelectedPeriod,
    selectedDay,
    setSelectedDay,
    fetchScreenTime,
    calculateTotalScreenTime,
  } = useUsageStats();
  
  const { formatUsageTime } = useAppNameUtils();

  const {
    checkPermission
  } = useAppBlock();
  
  const [fontsLoaded, setFontsLoaded] = useState(false);
  // selectedDay and setSelectedDay now come from useUsageStats
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Monday=0, Sunday=6
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    monday.setHours(0,0,0,0);
    return monday;
  });
  // Helper to format date as "Monday, 27 October"
  const formatDay = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  // Arrow handlers
  const changeDay = async (direction: number) => {
    setSelectedDay(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + direction);
      return newDate;
    });
  };

  // Refresh data when selectedDay changes and period is 'day'
  useEffect(() => {
    if (selectedPeriod === 'day') {
      fetchScreenTime();
    }
  }, [selectedDay, selectedPeriod]);

  const changeWeek = (direction: number) => {
    setSelectedWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + direction * 7);
      return newDate;
    });
    // TODO: Trigger data refresh for the new week if needed
  };

  // Format week range: "Oct 21 - Oct 27"
  const formatWeek = (start: Date) => {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}`;
  };

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
  
  // Time period selector component (kept inline since we're not extracting components)
  const TimePeriodSelector = () => (
    <View className="flex-row justify-center mb-6 bg-black rounded-full p-1">
      <TouchableOpacity
        className={`px-4 py-2 rounded-full ${selectedPeriod === 'day' ? 'bg-lightgrey' : 'bg-transparent'}`}
        onPress={() => setSelectedPeriod('day')}
      >
        <Text className={`${selectedPeriod === 'day' ? 'font-montserrat_bold text-black' : 'font-montserrat_medium text-gray'}`}>
          Day
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
      
    </View>
  );

  return (
    <View className="flex-1 bg-black px-4 py-6">
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="font-montserrat_extrabold text-lightgreen text-3xl">Screen Time</Text>
          <Text className="font-montserrat_light text-white text-lg">Track your digital wellbeing</Text>
        </View>
      </View>

      <TimePeriodSelector />

      {/* Picker: day or week depending on selectedPeriod */}
      {selectedPeriod === 'day' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <TouchableOpacity onPress={() => changeDay(-1)} style={{ padding: 8 }}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'montserrat_bold', marginHorizontal: 16 }}>
            {formatDay(selectedDay)}
          </Text>
          {/* Disable right arrow if selectedDay is today or in the future */}
          <TouchableOpacity
            onPress={() => {
              const today = new Date();
              today.setHours(0,0,0,0);
              const selected = new Date(selectedDay);
              selected.setHours(0,0,0,0);
              if (selected < today) changeDay(1);
            }}
            style={{ padding: 8 }}
            disabled={(() => {
              const today = new Date();
              today.setHours(0,0,0,0);
              const selected = new Date(selectedDay);
              selected.setHours(0,0,0,0);
              return selected >= today;
            })()}
          >
            <Ionicons
              name="chevron-forward"
              size={28}
              color={(() => {
                const today = new Date();
                today.setHours(0,0,0,0);
                const selected = new Date(selectedDay);
                selected.setHours(0,0,0,0);
                return selected >= today ? '#888' : '#fff';
              })()}
            />
          </TouchableOpacity>
        </View>
      ) : selectedPeriod === 'week' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <TouchableOpacity onPress={() => changeWeek(-1)} style={{ padding: 8 }}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'montserrat_bold', marginHorizontal: 16 }}>
            {formatWeek(selectedWeekStart)}
          </Text>
          {/* Disable right arrow if week is current or in the future */}
          <TouchableOpacity
            onPress={() => {
              const now = new Date();
              const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
              const thisMonday = new Date(now);
              thisMonday.setDate(now.getDate() - dayOfWeek);
              thisMonday.setHours(0,0,0,0);
              if (selectedWeekStart < thisMonday) changeWeek(1);
            }}
            style={{ padding: 8 }}
            disabled={(() => {
              const now = new Date();
              const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
              const thisMonday = new Date(now);
              thisMonday.setDate(now.getDate() - dayOfWeek);
              thisMonday.setHours(0,0,0,0);
              return selectedWeekStart >= thisMonday;
            })()}
          >
            <Ionicons
              name="chevron-forward"
              size={28}
              color={(() => {
                const now = new Date();
                const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
                const thisMonday = new Date(now);
                thisMonday.setDate(now.getDate() - dayOfWeek);
                thisMonday.setHours(0,0,0,0);
                return selectedWeekStart >= thisMonday ? '#888' : '#fff';
              })()}
            />
          </TouchableOpacity>
        </View>
      ) : null}

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lightgrey text-lg font-montserrat_regular">Loading usage data...</Text>
        </View>
      ) : (
        <>
          {/* Pie chart for today's screen time using react-native-pie-chart with total in center */}
          <View style={{ alignItems: 'center', marginBottom: 24, justifyContent: 'center', overflow: 'visible' }}>
            <View style={{ position: 'relative', width: 222, height: 222, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
              {usageStats.length === 0 ? (
                <PieChart
                  widthAndHeight={240}
                  series={[{ value: 1, color: '#949494' }]}
                  cover={0.5}
                  padAngle={0.01}
                />
              ) : (() => {
                const total = calculateTotalScreenTime();
                const topApps = usageStats.slice(0, 3);
                const otherTime = usageStats.slice(3).reduce((sum, app) => sum + app.totalTimeInForeground, 0);
                const colorsArr = ['#308695', '#D45769', '#E69D45', '#ACADA8'];
                const chartData = [
                  ...topApps.map((app, idx) => ({
                    value: app.totalTimeInForeground,
                    color: colorsArr[idx],
                    label: { text: app.appLabel ? (app.appLabel.length > 12 ? app.appLabel.slice(0, 12) + '…' : app.appLabel) : 'Unknown', fontWeight: 'bold', fill: '#fff', fontSize: 12 },
                  })),
                  {
                    value: otherTime,
                    color: colorsArr[3],
                    label: { text: 'Other', fontWeight: 'bold', fill: '#fff', fontSize: 12 },
                  },
                ].filter(slice => slice.value > 0);
                return (
                  <PieChart
                    widthAndHeight={240}
                    series={chartData}
                    cover={0.5}
                    padAngle={0.01}
                  />
                );
              })()}
              {/* Overlay total screen time in center */}
              <View style={{ position: 'absolute', top: 0, left: 0, width: 222, height: 222, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 28, fontFamily: 'montserrat_extrabold' }}>
                  {usageStats.length === 0 ? '0m' : formatUsageTime(calculateTotalScreenTime())}
                </Text>
              </View>
            </View>
          </View>
          <Text className="text-white text-xl font-montserrat_black mb-4">Top Apps</Text>
          <ScrollView className="flex-1">
            {usageStats.length === 0 ? null : usageStats.slice(0, 10).map((app, index) => (
              <View key={app.packageName} className="bg-gray mb-3 rounded-lg p-4">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    {/* App icon */}
                    {app.iconBase64 ? (
                      <Image
                        source={{ uri: `data:image/png;base64,${app.iconBase64}` }}
                        style={{ width: 32, height: 32, borderRadius: 8, marginRight: 12 }}
                        resizeMode="contain"
                      />
                    ) : null}
                    <View>
                      <Text className="text-lightgrey font-montserrat_light">
                        {app.appLabel || app.appName}
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