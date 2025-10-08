import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import React from 'react';
import colors from '../../../assets/colors.js';
import { useAuth } from '../../hooks/useAuth';

const LogIn = () => {
    const { 
        username, 
        setUsername, 
        password, 
        setPassword, 
        handleLogin, 
        isLoading,
        loginError,
        setLoginError
    } = useAuth();
    
    return (
        <View className="flex-1 justify-center items-center bg-black p-6">
            <Text className="text-verylightgreen text-3xl font-bold mb-10">Log In</Text>
            <TextInput
                placeholder="Username or Email"
                placeholderTextColor={colors.lightgrey}
                value={username}
                onChangeText={text => {
                    setUsername(text);
                    if (loginError) setLoginError('');
                }}
                className={`bg-black border w-full rounded-md p-3 mb-5 text-lightgrey ${loginError ? 'border-red-500' : 'border-lightgrey'}`}
                autoCapitalize="none"
            />
            <TextInput
                placeholder="Password"
                placeholderTextColor={colors.lightgrey}
                value={password}
                onChangeText={text => {
                    setPassword(text);
                    if (loginError) setLoginError('');
                }}
                secureTextEntry
                className={`bg-black border w-full rounded-md p-3 mb-2 text-lightgrey ${loginError ? 'border-red-500' : 'border-lightgrey'}`}
            />
            {loginError ? (
                <Text className="text-red-500 w-full text-center mb-6">Username or password is wrong</Text>
            ) : (
                <View style={{ height: 24 }} />
            )}
            <TouchableOpacity 
                onPress={handleLogin} 
                disabled={isLoading}
                className={`w-full py-3 rounded-md mb-6 ${isLoading ? 'bg-gray-500' : 'bg-verylightgreen'}`}>
                {isLoading ? (
                    <ActivityIndicator size="small" color="#000000" />
                ) : (
                    <Text className="text-black font-bold text-center text-lg">Log In</Text>
                )}
            </TouchableOpacity>
            <View className="flex-row items-center mt-4">
                <Text className="text-lightgrey mr-2">Don't have an account?</Text>
                <Link href="/signup" asChild>
                    <TouchableOpacity>
                        <Text className="text-verylightgreen font-bold">Sign Up</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
};

export default LogIn;