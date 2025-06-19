import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, BackHandler } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../assets/colors.js';
import RNExitApp from 'react-native-exit-app';

// Array of inspiring quotes about digital wellbeing
const WELLBEING_QUOTES = [
  "The present moment is the only time over which we have dominion.",
  "Disconnect to reconnect with what truly matters.",
  "Your time is limited, don't waste it living someone else's life.",
  "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
  "Almost everything will work again if you unplug it for a few minutes, including you.",
  "Technology can be our best friend, but it can also be the biggest party pooper of our lives.",
  "What you stay focused on will grow.",
  "Mindfulness isn't difficult. We just need to remember to do it.",
  "Your time is precious, spend it wisely.",
  "Be present in the moment, not just in the room."
];

export default function AppBlocked() {
  const params = useLocalSearchParams();
  const [quote, setQuote] = useState('');
  
  // Get blocked app name from params
  const blockedApp = params.packageName as string;

  useEffect(() => {
    // Select a random quote
    const randomIndex = Math.floor(Math.random() * WELLBEING_QUOTES.length);
    setQuote(WELLBEING_QUOTES[randomIndex]);
  }, []);


  return (
    <View className="flex-1 bg-black px-4 pt-12 justify-center items-center">
      <View className="items-center mb-8">
        <Ionicons name="time" size={80} color={colors.verylightgreen} />
      </View>
      
      <Text className="text-verylightgreen text-3xl font-bold text-center mb-2">
        App Blocked
      </Text>
      
      <Text className="text-white text-xl text-center mb-8">
        {`You've reached your limit for this app`}
      </Text>
      
      <View className="bg-gray-800 rounded-lg p-6 w-full mb-8">
        <Text className="text-lightgrey text-lg text-center italic">
          "{quote}"
        </Text>
      </View>
      
      <TouchableOpacity 
        className="bg-verylightgreen px-6 py-3 rounded-md mb-4"
        onPress={() => {
          // First navigate away from the deep-linked screen
          router.replace("/blockscreen");
          RNExitApp.exitApp();
        }}
      >
        <Text className="text-black font-bold">Close App</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => router.push('(tabs)')}
      >
        <Text className="text-lightgrey">Manage Blocked Apps</Text>
      </TouchableOpacity>
    </View>
  );
}