import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import React from 'react';
import colors from '../../../assets/colors.js';
import { useAuth } from '../../hooks/useAuth';

const SignUp = () => {
    const { 
        email, 
        setEmail, 
        username, 
        setUsername, 
        password, 
        setPassword, 
        handleSignUp,
        isLoading 
    } = useAuth();

    return (
        <View className="flex-1 justify-center items-center bg-black p-6">
            <Text className="text-verylightgreen text-3xl font-bold mb-10">Sign Up</Text>
            
            <TextInput
                placeholder="Email"
                placeholderTextColor={colors.lightgrey}
                value={email}
                onChangeText={setEmail}
                className="bg-black border border-lightgrey w-full rounded-md p-3 mb-5 text-lightgrey"
                keyboardType="email-address"
                autoCapitalize="none"
            />
            
            <TextInput
                placeholder="Username"
                placeholderTextColor={colors.lightgrey}
                value={username}
                onChangeText={setUsername}
                className="bg-black border border-lightgrey w-full rounded-md p-3 mb-5 text-lightgrey"
                autoCapitalize="none"
            />
            
            <TextInput
                placeholder="Password"
                placeholderTextColor={colors.lightgrey}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="bg-black border border-lightgrey w-full rounded-md p-3 mb-8 text-lightgrey"
            />
            
            <TouchableOpacity 
                onPress={handleSignUp}
                disabled={isLoading}
                className={`w-full py-3 rounded-md mb-6 ${isLoading ? 'bg-gray-500' : 'bg-verylightgreen'}`}>
                {isLoading ? (
                    <ActivityIndicator size="small" color="#000000" />
                ) : (
                    <Text className="text-black font-bold text-center text-lg">Sign Up</Text>
                )}
            </TouchableOpacity>
            
            <View className="flex-row items-center mt-4">
                <Text className="text-lightgrey mr-2">Already have an account?</Text>
                <Link href="/login" asChild>
                    <TouchableOpacity>
                        <Text className="text-verylightgreen font-bold">Login</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
};

export default SignUp;