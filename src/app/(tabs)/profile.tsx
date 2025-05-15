import React from 'react';
import { SafeAreaView, View, Text, Image, ActivityIndicator } from 'react-native';
import { useProfile } from '../../hooks/useProfile';

export default function ProfileScreen() {
    const { userData, loading, error } = useProfile();
    const { username, email, name, avatarURL } = userData;

    if (loading) return (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#6200ee" />
            <Text className="mt-3 text-base">Loading profile...</Text>
        </View>
    );
    
    if (error) return (
        <View className="flex-1 justify-center items-center p-5">
            <Text className="text-red-500 text-base text-center">{error}</Text>
        </View>
    );

    return (
        <View className="bg-black flex-1 pt-20">
            <View className="p-5 items-center">
                <View className="mb-5 items-center">
                    {avatarURL ? (
                        <Image 
                            source={{ uri: avatarURL }} 
                            className="w-24 h-24 rounded-full" 
                        />
                    ) : (
                        <View className="w-24 h-24 rounded-full bg-purple-700 justify-center items-center">
                            <Text className="text-white text-4xl font-bold">
                                {username && username.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>
                
                <View className="w-full rounded-lg p-5 shadow-sm">
                    <View className="flex-row mb-4 pb-2">
                        <Text className="w-1/3 font-bold text-white">Username:</Text>
                        <Text className="w-2/3 text-lightgrey">{username}</Text>
                    </View>
                    
                    <View className="flex-row mb-4 border-b border-gray-100 pb-2">
                        <Text className="w-1/3 font-bold text-white">Email:</Text>
                        <Text className="w-2/3 text-lightgrey">{email}</Text>
                    </View>
                    
                    <View className="flex-row mb-4 border-b border-gray-100 pb-2">
                        <Text className="w-1/3 font-bold text-white">Name:</Text>
                        <Text className="w-2/3 text-lightgrey">{name}</Text>
                    </View>
                    
                    <View className="flex-row mb-4 border-b border-gray-100 pb-2">
                        <Text className="w-1/3 font-bold text-white">Avatar URL:</Text>
                        <Text className="w-2/3 text-lightgrey" numberOfLines={1} ellipsizeMode="middle">
                            {avatarURL || 'None'}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}