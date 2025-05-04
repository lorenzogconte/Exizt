import { View, Text, TextInput, TouchableOpacity, Alert} from 'react-native';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import axios from 'axios';
import colors from '../../../assets/colors.js';

const LogIn = () => {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogIn = async () => {
        try {
            const response = await axios.post('http://10.0.2.2:8000/login/', {
                username,
                password,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            console.log("Login success, navigating to profile");
            router.replace('/(tabs)/profile');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // Handle Axios specific errors
                if (error.response) {
                    // The server responded with a status code outside of 2xx range
                    const errorMessage = error.response.data.message || 'Something went wrong.';
                    Alert.alert('Error', errorMessage);
                } else if (error.request) {
                    // The request was made but no response was received
                    Alert.alert('Error', 'No response from server. Check your connection.');
                } else {
                    // Something happened in setting up the request
                    Alert.alert('Error', 'Failed to make request.');
                }
            } else {
                // Handle non-Axios errors
                Alert.alert('Error', 'An unexpected error occurred.');
            }
        }
    };
    
    return (
        <View className="flex-1 justify-center items-center bg-deepblue p-6">
            <Text className="text-mint text-3xl font-bold mb-10">Log In</Text>
            
            <TextInput
                placeholder="Username or Email"
                placeholderTextColor={colors.mint}
                value={username}
                onChangeText={setUsername}
                className="bg-darkteal border border-turquoise w-full rounded-md p-3 mb-5 text-lightgrey"
            />
            
            <TextInput
                placeholder="Password"
                placeholderTextColor={colors.mint}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="bg-darkteal border border-turquoise w-full rounded-md p-3 mb-8 text-lightgrey"
            />
            
            <TouchableOpacity 
                onPress={handleLogIn} 
                className="bg-turquoise w-full py-3 rounded-md mb-6">
                <Text className="text-deepblue font-bold text-center text-lg">Log In</Text>
            </TouchableOpacity>
            
            <View className="flex-row items-center mt-4">
                <Text className="text-lightgrey mr-2">Don't have an account?</Text>
                <Link href="/signup" asChild>
                    <TouchableOpacity>
                        <Text className="text-mint font-bold">Sign Up</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
};

export default LogIn;